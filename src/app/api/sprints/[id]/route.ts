import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const updateSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  totalStoryPoints: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const sprintId = params.id

    let whereClause: any = { id: sprintId }

    // Check user access
    if (user.role !== 'ADMIN') {
      whereClause.project = {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    }

    const sprint = await prisma.sprint.findFirst({
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
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate metrics
    const completedTasks = sprint.tasks.filter(task => task.status === 'DONE')
    const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
    const totalStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    const sprintWithMetrics = {
      ...sprint,
      completedStoryPoints,
      totalStoryPoints,
      completedTasks: completedTasks.length,
      totalTasks: sprint.tasks.length,
      progress: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
    }

    return NextResponse.json({ sprint: sprintWithMetrics })

  } catch (error) {
    console.error('Get sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprint' },
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
    const sprintId = params.id
    const body = await request.json()
    
    const validatedData = updateSprintSchema.parse(body)

    // Check if user has access to sprint
    let whereClause: any = { id: sprintId }
    if (user.role !== 'ADMIN') {
      whereClause.project = {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    }

    const existingSprint = await prisma.sprint.findFirst({
      where: whereClause,
      include: { project: true }
    })

    if (!existingSprint) {
      return NextResponse.json(
        { error: 'Sprint not found or access denied' },
        { status: 404 }
      )
    }

    // Validate dates if provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.endDate <= validatedData.startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: validatedData,
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

    return NextResponse.json({ sprint })

  } catch (error) {
    console.error('Update sprint error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update sprint' },
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
    const sprintId = params.id

    // Check if user has access to sprint
    let whereClause: any = { id: sprintId }
    if (user.role !== 'ADMIN') {
      whereClause.project = {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    }

    const existingSprint = await prisma.sprint.findFirst({
      where: whereClause,
      include: { 
        tasks: true,
        project: true 
      }
    })

    if (!existingSprint) {
      return NextResponse.json(
        { error: 'Sprint not found or access denied' },
        { status: 404 }
      )
    }

    // Check if sprint has tasks
    if (existingSprint.tasks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete sprint with tasks. Move tasks to another sprint first.' },
        { status: 400 }
      )
    }

    await prisma.sprint.delete({
      where: { id: sprintId }
    })

    return NextResponse.json({ message: 'Sprint deleted successfully' })

  } catch (error) {
    console.error('Delete sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to delete sprint' },
      { status: 500 }
    )
  }
}
