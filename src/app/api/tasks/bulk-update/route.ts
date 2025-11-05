import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    position: z.number().optional(),
    assigneeId: z.string().optional()
  }))
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { updates } = bulkUpdateSchema.parse(body)

    // Get all tasks to verify permissions
    const taskIds = updates.map(update => update.id)
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
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

    // Check permissions for all tasks
    for (const task of tasks) {
      const canEdit = user.role === 'ADMIN' ||
                     user.role === 'PROJECT_MANAGER' ||
                     task.assigneeId === user.id ||
                     task.createdById === user.id ||
                     task.project.ownerId === user.id ||
                     task.project.members.length > 0

      if (!canEdit) {
        return NextResponse.json(
          { error: `Insufficient permissions to edit task: ${task.title}` },
          { status: 403 }
        )
      }
    }

    // Perform bulk update in transaction
    const updatedTasks = await prisma.$transaction(async (tx) => {
      const results = []

      for (const update of updates) {
        const task = tasks.find(t => t.id === update.id)
        if (!task) continue

        const updatedTask = await tx.task.update({
          where: { id: update.id },
          data: {
            ...(update.status && { status: update.status }),
            ...(update.position !== undefined && { position: update.position }),
            ...(update.assigneeId && { assigneeId: update.assigneeId }),
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
            _count: {
              select: {
                comments: true,
                attachments: true,
                timeEntries: true
              }
            }
          }
        })

        results.push(updatedTask)

        // Create notification if assignee changed
        if (update.assigneeId && update.assigneeId !== task.assigneeId && update.assigneeId !== user.id) {
          await tx.notification.create({
            data: {
              userId: update.assigneeId,
              type: 'TASK_ASSIGNED',
              title: 'Task reassigned',
              message: `You have been assigned to task: ${updatedTask.title}`,
              relatedId: updatedTask.id
            }
          })
        }
      }

      return results
    })

    return NextResponse.json({ 
      message: 'Tasks updated successfully',
      tasks: updatedTasks 
    })

  } catch (error: any) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update tasks' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
