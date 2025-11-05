import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const taskId = params.id

    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
            status: true,
            ownerId: true,
            members: {
              select: {
                userId: true,
                role: true
              }
            }
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
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { startTime: 'desc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this task
    const hasAccess = user.role === 'ADMIN' ||
                     task.assigneeId === user.id ||
                     task.createdById === user.id ||
                     task.project.ownerId === user.id ||
                     task.project.members.some(member => member.userId === user.id) ||
                     (user.role === 'CLIENT' && task.project.clientId === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(task)

  } catch (error: any) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const taskId = params.id
    const body = await request.json()
    const data = updateTaskSchema.parse(body)

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canEdit = user.role === 'ADMIN' ||
                   user.role === 'PROJECT_MANAGER' ||
                   existingTask.assigneeId === user.id ||
                   existingTask.createdById === user.id ||
                   existingTask.project.ownerId === user.id ||
                   existingTask.project.members.length > 0

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this task' },
        { status: 403 }
      )
    }

    // Handle position updates for drag & drop
    if (data.status && data.position !== undefined && 
        (data.status !== existingTask.status || data.position !== existingTask.position)) {
      
      // If moving to a different status column
      if (data.status !== existingTask.status) {
        // Update positions in the old column
        await prisma.task.updateMany({
          where: {
            projectId: existingTask.projectId,
            status: existingTask.status,
            position: { gt: existingTask.position }
          },
          data: {
            position: { decrement: 1 }
          }
        })

        // Update positions in the new column
        await prisma.task.updateMany({
          where: {
            projectId: existingTask.projectId,
            status: data.status,
            position: { gte: data.position }
          },
          data: {
            position: { increment: 1 }
          }
        })
      } else {
        // Moving within the same column
        if (data.position > existingTask.position) {
          // Moving down
          await prisma.task.updateMany({
            where: {
              projectId: existingTask.projectId,
              status: existingTask.status,
              position: {
                gt: existingTask.position,
                lte: data.position
              }
            },
            data: {
              position: { decrement: 1 }
            }
          })
        } else {
          // Moving up
          await prisma.task.updateMany({
            where: {
              projectId: existingTask.projectId,
              status: existingTask.status,
              position: {
                gte: data.position,
                lt: existingTask.position
              }
            },
            data: {
              position: { increment: 1 }
            }
          })
        }
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedAt: new Date()
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

    // Create notification if assignee changed
    if (data.assigneeId && data.assigneeId !== existingTask.assigneeId && data.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task reassigned',
          message: `You have been assigned to task: ${task.title}`,
          relatedId: task.id
        }
      })
    }

    return NextResponse.json(task)

  } catch (error: any) {
    console.error('Task update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const taskId = params.id

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canDelete = user.role === 'ADMIN' ||
                     user.role === 'PROJECT_MANAGER' ||
                     task.createdById === user.id ||
                     task.project.ownerId === user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this task' },
        { status: 403 }
      )
    }

    // Delete task and update positions
    await prisma.$transaction(async (tx) => {
      // Delete the task
      await tx.task.delete({
        where: { id: taskId }
      })

      // Update positions of remaining tasks
      await tx.task.updateMany({
        where: {
          projectId: task.projectId,
          status: task.status,
          position: { gt: task.position }
        },
        data: {
          position: { decrement: 1 }
        }
      })
    })

    return NextResponse.json({ message: 'Task deleted successfully' })

  } catch (error: any) {
    console.error('Task deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
