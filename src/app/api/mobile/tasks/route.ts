import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mobile/tasks - Mobile-optimized task list
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    
    // Build where clause
    let whereClause: any = {
      assigneeId: user.id
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (projectId) {
      whereClause.projectId = projectId
    }
    
    if (priority) {
      whereClause.priority = priority
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Get tasks with pagination
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              comments: true,
              attachments: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { updatedAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      
      prisma.task.count({ where: whereClause })
    ])
    
    // Format tasks for mobile
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      storyPoints: task.storyPoints,
      project: task.project,
      assignee: task.assignee,
      commentsCount: task._count.comments,
      attachmentsCount: task._count.attachments,
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: formattedTasks,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Mobile tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to load tasks' },
      { status: 500 }
    )
  }
}

// POST /api/mobile/tasks - Create new task (mobile-optimized)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      title,
      description,
      projectId,
      priority = 'MEDIUM',
      dueDate,
      estimatedHours,
      storyPoints,
      assigneeId
    } = body
    
    // Validate required fields
    if (!title || !projectId) {
      return NextResponse.json(
        { error: 'Title and project are required' },
        { status: 400 }
      )
    }
    
    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { team: { some: { id: user.id } } }
        ]
      }
    })
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }
    
    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        storyPoints: storyPoints ? parseInt(storyPoints) : null,
        assigneeId: assigneeId || user.id,
        createdById: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'task_created',
        details: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          platform: 'mobile'
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        storyPoints: task.storyPoints,
        project: task.project,
        assignee: task.assignee,
        createdAt: task.createdAt
      },
      message: 'Task created successfully'
    })

  } catch (error) {
    console.error('Mobile task creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PUT /api/mobile/tasks/[id] - Update task status (mobile quick action)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { taskId, status, actualHours, notes } = body
    
    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'Task ID and status are required' },
        { status: 400 }
      )
    }
    
    // Verify user has access to task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assigneeId: user.id },
          { project: { ownerId: user.id } },
          { project: { team: { some: { id: user.id } } } }
        ]
      }
    })
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }
    
    // Update task
    const updateData: any = { status }
    
    if (actualHours !== undefined) {
      updateData.actualHours = parseFloat(actualHours)
    }
    
    if (status === 'DONE') {
      updateData.completedAt = new Date()
    } else if (existingTask.status === 'DONE' && status !== 'DONE') {
      updateData.completedAt = null
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    // Add comment if notes provided
    if (notes) {
      await prisma.comment.create({
        data: {
          content: notes,
          taskId,
          authorId: user.id
        }
      })
    }
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'task_updated',
        details: {
          taskId,
          oldStatus: existingTask.status,
          newStatus: status,
          platform: 'mobile'
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        actualHours: updatedTask.actualHours,
        completedAt: updatedTask.completedAt,
        updatedAt: updatedTask.updatedAt
      },
      message: 'Task updated successfully'
    })

  } catch (error) {
    console.error('Mobile task update error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
