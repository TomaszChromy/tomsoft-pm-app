import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createProjectSchema, paginationSchema, projectFiltersSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    const filters = projectFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
    })

    // Build where clause
    const where: any = {}

    // Role-based filtering
    if (user.role === 'CLIENT') {
      // Clients can only see projects where they are the client
      where.client = { email: user.email }
    } else if (user.role !== 'ADMIN') {
      // Non-admin users can only see projects they own or are members of
      where.OR = [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }

    // Apply filters
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.ownerId) where.ownerId = filters.ownerId

    // Apply search
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } },
      ]
    }

    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit

    // Get projects with relations
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: {
          [pagination.sortBy!]: pagination.sortOrder,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              company: true,
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            }
          },
          tasks: {
            select: {
              id: true,
              status: true,
            }
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    // Calculate additional metrics for each project
    const projectsWithMetrics = projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        ...project,
        metrics: {
          totalTasks,
          completedTasks,
          progressPercentage,
          totalComments: project._count.comments,
        }
      }
    })

    return NextResponse.json({
      projects: projectsWithMetrics,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      }
    })

  } catch (error: any) {
    console.error('Get projects error:', error)
    
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only admins and project managers can create projects
    if (!['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Create project
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        ownerId: user.id,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          }
        },
      }
    })

    return NextResponse.json({
      message: 'Project created successfully',
      project,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create project error:', error)
    
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
