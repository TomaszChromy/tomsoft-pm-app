import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createTaskSchema, paginationSchema, taskFiltersSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const projectId = params.id
    const { searchParams } = new URL(request.url)

    // Check project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: user.id },
          select: { userId: true }
        },
        client: {
          select: { email: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const hasAccess = 
      user.role === 'ADMIN' ||
      project.ownerId === user.id ||
      project.members.length > 0 ||
      (user.role === 'CLIENT' && project.client?.email === user.email)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'position',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    })

    const filters = taskFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
    })

    // Build where clause
    const where: any = {
      projectId,
      parentId: null, // Only get top-level tasks
    }

    // Apply filters
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.assigneeId) where.assigneeId = filters.assigneeId

    // Apply search
    if (pagination.search) {
      where.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } },
      ]
    }

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit

    // Get tasks with relations
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: [
          { status: 'asc' },
          { position: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          subtasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            },
            orderBy: { position: 'asc' }
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 3 // Latest 3 comments
          },
          _count: {
            select: {
              comments: true,
              subtasks: true,
              timeEntries: true,
            }
          }
        }
      }),
      prisma.task.count({ where })
    ])

    // Group tasks by status for Kanban view
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    }, {} as Record<string, typeof tasks>)

    return NextResponse.json({
      tasks,
      tasksByStatus,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      }
    })

  } catch (error: any) {
    console.error('Get tasks error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const projectId = params.id

    // Check project access and permissions
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: user.id },
          select: { role: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check permissions - only project members can create tasks
    const isOwner = project.ownerId === user.id
    const isMember = project.members.length > 0
    const canCreate = user.role === 'ADMIN' || isOwner || isMember

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Get next position for the status column
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId,
        status: validatedData.status || 'TODO',
      },
      orderBy: { position: 'desc' }
    })

    const position = validatedData.position ?? (lastTask?.position ?? 0) + 1

    // Create task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        projectId,
        position,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Create notification for assignee if different from creator
    if (task.assigneeId && task.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
          type: 'TASK_ASSIGNED',
          userId: task.assigneeId,
        }
      })
    }

    return NextResponse.json({
      message: 'Task created successfully',
      task,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create task error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error.name === 'ZodError') {
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
