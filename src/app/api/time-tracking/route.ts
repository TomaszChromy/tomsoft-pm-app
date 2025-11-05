import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const timeEntrySchema = z.object({
  description: z.string().optional(),
  hours: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isRunning: z.boolean().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().optional(),
  tags: z.array(z.string()).default([]).transform(tags => tags.join(',')),
  projectId: z.string(),
  taskId: z.string().optional()
})

// GET /api/time-tracking - Get time entries
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const userId = searchParams.get('userId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const isRunning = searchParams.get('isRunning')

    const whereClause: any = {}

    // Filter by user role
    if (user.role === 'CLIENT') {
      whereClause.project = { clientId: user.id }
    } else if (user.role === 'DEVELOPER' && !userId) {
      whereClause.userId = user.id
    }

    if (projectId) whereClause.projectId = projectId
    if (taskId) whereClause.taskId = taskId
    if (userId && (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER')) {
      whereClause.userId = userId
    }
    if (isRunning) whereClause.isRunning = isRunning === 'true'

    if (from || to) {
      whereClause.date = {}
      if (from) whereClause.date.gte = new Date(from)
      if (to) whereClause.date.lte = new Date(to)
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
    const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + Number(entry.hours), 0)
    const totalEarnings = timeEntries.reduce((sum, entry) => {
      if (entry.billable && entry.hourlyRate) {
        return sum + (Number(entry.hours) * Number(entry.hourlyRate))
      }
      return sum
    }, 0)

    // Transform tags from string to array
    const transformedEntries = timeEntries.map(entry => ({
      ...entry,
      tags: entry.tags ? entry.tags.split(',').filter(tag => tag.trim()) : []
    }))

    return NextResponse.json({
      timeEntries: transformedEntries,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        entriesCount: timeEntries.length
      }
    })
  } catch (error) {
    console.error('Time tracking GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/time-tracking - Create time entry
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = timeEntrySchema.parse(body)

    // Check if user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        OR: [
          { ownerId: user.id },
          { clientId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // If task is specified, check access
    if (validatedData.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: validatedData.taskId,
          projectId: validatedData.projectId
        }
      })

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
    }

    // Stop any running timers for this user
    if (validatedData.isRunning) {
      await prisma.timeEntry.updateMany({
        where: {
          userId: user.id,
          isRunning: true
        },
        data: {
          isRunning: false,
          endTime: new Date()
        }
      })
    }

    // Calculate hours if start/end time provided
    let hours = validatedData.hours || 0
    if (validatedData.startTime && validatedData.endTime && !validatedData.isRunning) {
      const start = new Date(validatedData.startTime)
      const end = new Date(validatedData.endTime)
      hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert to hours
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: validatedData.description,
        hours: hours,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        isRunning: validatedData.isRunning || false,
        billable: validatedData.billable,
        hourlyRate: validatedData.hourlyRate,
        tags: validatedData.tags,
        userId: user.id,
        projectId: validatedData.projectId,
        taskId: validatedData.taskId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({ timeEntry }, { status: 201 })
  } catch (error) {
    console.error('Time tracking POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
