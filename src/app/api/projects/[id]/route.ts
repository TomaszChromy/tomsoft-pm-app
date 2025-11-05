import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { updateProjectSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const projectId = params.id

    // Get project with all relations
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
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
                email: true,
                role: true,
              }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            },
            _count: {
              select: {
                comments: true,
                subtasks: true,
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { position: 'asc' },
            { createdAt: 'desc' }
          ]
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
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            task: {
              select: {
                id: true,
                title: true,
              }
            }
          },
          orderBy: { date: 'desc' }
        },
        _count: {
          select: {
            tasks: true,
            comments: true,
            timeEntries: true,
          }
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
      project.members.some(member => member.userId === user.id) ||
      (user.role === 'CLIENT' && project.client?.email === user.email)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Calculate project metrics
    const totalTasks = project.tasks.length
    const tasksByStatus = project.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const completedTasks = tasksByStatus.DONE || 0
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const totalHours = project.timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
    const estimatedHours = project.tasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0)

    const projectWithMetrics = {
      ...project,
      metrics: {
        totalTasks,
        completedTasks,
        progressPercentage,
        tasksByStatus,
        totalHours,
        estimatedHours,
        totalComments: project._count.comments,
        totalTimeEntries: project._count.timeEntries,
      }
    }

    return NextResponse.json({
      project: projectWithMetrics,
    })

  } catch (error: any) {
    console.error('Get project error:', error)
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const projectId = params.id

    // Check if project exists and user has permission
    const existingProject = await prisma.project.findUnique({
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

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = existingProject.ownerId === user.id
    const isLead = existingProject.members.some(member => member.role === 'LEAD')
    const canEdit = user.role === 'ADMIN' || isOwner || isLead

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...validatedData,
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
      message: 'Project updated successfully',
      project,
    })

  } catch (error: any) {
    console.error('Update project error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const projectId = params.id

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        name: true,
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Only admins and project owners can delete projects
    if (user.role !== 'ADMIN' && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({
      message: 'Project deleted successfully',
    })

  } catch (error: any) {
    console.error('Delete project error:', error)
    
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
