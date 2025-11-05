import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const sprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  description: z.string().optional(),
  projectId: z.string(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  totalStoryPoints: z.number().optional().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    let whereClause: any = {}

    // Filter by project if specified
    if (projectId) {
      whereClause.projectId = projectId
    }

    // Filter by status if specified
    if (status) {
      whereClause.status = status
    }

    // Check user access to projects
    if (user.role !== 'ADMIN') {
      whereClause.project = {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    }

    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            completedAt: true,
          }
        },
        _count: {
          select: {
            tasks: true,
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Calculate sprint metrics
    const sprintsWithMetrics = sprints.map(sprint => {
      const completedTasks = sprint.tasks.filter(task => task.status === 'DONE')
      const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
      const totalStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
      
      return {
        ...sprint,
        completedStoryPoints,
        totalStoryPoints,
        completedTasks: completedTasks.length,
        totalTasks: sprint.tasks.length,
        progress: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
      }
    })

    return NextResponse.json({
      sprints: sprintsWithMetrics,
      total: sprints.length
    })

  } catch (error) {
    console.error('Get sprints error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = sprintSchema.parse(body)

    // Check if user has access to project
    let project
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

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Validate dates
    if (validatedData.endDate <= validatedData.startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const sprint = await prisma.sprint.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        projectId: validatedData.projectId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        totalStoryPoints: validatedData.totalStoryPoints,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        tasks: true,
      }
    })

    return NextResponse.json({ sprint }, { status: 201 })

  } catch (error) {
    console.error('Create sprint error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    )
  }
}
