import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const startTimerSchema = z.object({
  description: z.string().optional(),
  projectId: z.string(),
  taskId: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().optional(),
  tags: z.array(z.string()).default([]).transform(tags => tags.join(','))
})

// GET /api/time-tracking/timer - Get current running timer
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if any time entries exist first
    const timeEntryCount = await prisma.timeEntry.count({
      where: {
        userId: user.id
      }
    })

    console.log('Time entries for user:', timeEntryCount)

    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        isRunning: true
      },
      include: {
        project: true,
        task: true
      }
    })

    if (!runningTimer) {
      return NextResponse.json({ timer: null })
    }

    // Calculate current elapsed time
    const elapsedMs = runningTimer.startTime 
      ? Date.now() - runningTimer.startTime.getTime()
      : 0
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    return NextResponse.json({
      timer: runningTimer ? {
        ...runningTimer,
        tags: runningTimer.tags ? runningTimer.tags.split(',').filter((tag: string) => tag.trim()) : [],
        elapsedHours: Math.round(elapsedHours * 100) / 100,
        elapsedMs
      } : null
    })
  } catch (error) {
    console.error('Timer GET error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/time-tracking/timer/start - Start timer
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = startTimerSchema.parse(body)

    // Check if user has access to project
    console.log('Looking for project:', validatedData.projectId, 'for user:', user.id, 'role:', user.role)

    let project

    // Admin can access all projects
    if (user.role === 'ADMIN') {
      project = await prisma.project.findUnique({
        where: { id: validatedData.projectId }
      })
    } else {
      project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      })
    }

    console.log('Project found:', project ? 'YES' : 'NO')

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Stop any existing running timers for this user
    const existingTimers = await prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        isRunning: true
      }
    })

    for (const timer of existingTimers) {
      const endTime = new Date()
      const hours = timer.startTime 
        ? (endTime.getTime() - timer.startTime.getTime()) / (1000 * 60 * 60)
        : 0

      await prisma.timeEntry.update({
        where: { id: timer.id },
        data: {
          isRunning: false,
          endTime,
          hours: Math.round(hours * 100) / 100
        }
      })
    }

    // Create new timer
    const timer = await prisma.timeEntry.create({
      data: {
        description: validatedData.description,
        hours: 0,
        startTime: new Date(),
        isRunning: true,
        billable: validatedData.billable,
        hourlyRate: validatedData.hourlyRate,
        tags: validatedData.tags,
        userId: user.id,
        projectId: validatedData.projectId,
        taskId: validatedData.taskId
      },
      include: {
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

    return NextResponse.json({
      timer: {
        ...timer,
        tags: timer.tags ? timer.tags.split(',').filter((tag: string) => tag.trim()) : []
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Timer start error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/time-tracking/timer/stop - Stop current timer
export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runningTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        isRunning: true
      }
    })

    if (!runningTimer) {
      return NextResponse.json({ error: 'No running timer found' }, { status: 404 })
    }

    const endTime = new Date()
    const hours = runningTimer.startTime 
      ? (endTime.getTime() - runningTimer.startTime.getTime()) / (1000 * 60 * 60)
      : 0

    const timer = await prisma.timeEntry.update({
      where: { id: runningTimer.id },
      data: {
        isRunning: false,
        endTime,
        hours: Math.round(hours * 100) / 100
      },
      include: {
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

    return NextResponse.json({
      timer: {
        ...timer,
        tags: timer.tags ? timer.tags.split(',').filter((tag: string) => tag.trim()) : []
      }
    })
  } catch (error) {
    console.error('Timer stop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
