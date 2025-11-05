import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTaskSchema, querySchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const query = querySchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })

    // Build where clause based on user role and filters
    const whereClause: any = {}

    // Role-based filtering
    if (user.role === 'CLIENT') {
      whereClause.project = {
        clientId: user.id
      }
    } else if (user.role !== 'ADMIN') {
      whereClause.OR = [
        { assigneeId: user.id },
        { project: { ownerId: user.id } },
        { project: { members: { some: { userId: user.id } } } }
      ]
    }

    // Apply filters
    if (query.search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.status) {
      whereClause.status = query.status
    }

    if (query.priority) {
      whereClause.priority = query.priority
    }

    if (query.projectId) {
      whereClause.projectId = query.projectId
    }

    if (query.assigneeId) {
      whereClause.assigneeId = query.assigneeId
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
              timeEntries: true
            }
          }
        },
        orderBy: {
          [query.sortBy]: query.sortOrder
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.task.count({ where: whereClause })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })

  } catch (error: any) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = createTaskSchema.parse(body)

    // Check if user has permission to create tasks in this project
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const canCreateTask = user.role === 'ADMIN' || 
                         user.role === 'PROJECT_MANAGER' ||
                         project.ownerId === user.id ||
                         project.members.length > 0

    if (!canCreateTask) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tasks in this project' },
        { status: 403 }
      )
    }

    // Get the highest position in the status column
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId: data.projectId,
        status: data.status || 'TODO'
      },
      orderBy: { position: 'desc' }
    })

    const position = (lastTask?.position || 0) + 1

    const task = await prisma.task.create({
      data: {
        ...data,
        position,
        createdById: user.id
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            timeEntries: true
          }
        }
      }
    })

    // Create notification for assignee if different from creator
    if (data.assigneeId && data.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `You have been assigned to task: ${task.title}`,
          relatedId: task.id
        }
      })
    }

    return NextResponse.json(task, { status: 201 })

  } catch (error: any) {
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
