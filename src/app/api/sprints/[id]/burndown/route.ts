import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
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

    const sprint = await prisma.sprint.findFirst({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            completedAt: true,
            createdAt: true,
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

    // Calculate total story points
    const totalStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)

    // Generate date range for the sprint
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const today = new Date()
    
    // Calculate days in sprint
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.min(
      Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      totalDays
    )

    // Generate burndown data points
    const burndownData = []
    const idealBurndownData = []

    // Calculate ideal burndown (linear)
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + day)
      
      const idealRemaining = totalStoryPoints - (totalStoryPoints * day / totalDays)
      
      idealBurndownData.push({
        date: date.toISOString().split('T')[0],
        day: day,
        remaining: Math.max(0, Math.round(idealRemaining * 100) / 100)
      })
    }

    // Calculate actual burndown
    for (let day = 0; day <= Math.min(daysElapsed, totalDays); day++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + day)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Count completed story points up to this day
      const completedStoryPoints = sprint.tasks
        .filter(task => {
          if (task.status !== 'DONE' || !task.completedAt) return false
          const completedDate = new Date(task.completedAt)
          return completedDate <= endOfDay
        })
        .reduce((sum, task) => sum + (task.storyPoints || 0), 0)

      const remaining = totalStoryPoints - completedStoryPoints

      burndownData.push({
        date: date.toISOString().split('T')[0],
        day: day,
        remaining: Math.max(0, remaining),
        completed: completedStoryPoints
      })
    }

    // Calculate velocity and predictions
    const currentCompleted = burndownData.length > 0 ? burndownData[burndownData.length - 1].completed : 0
    const currentDay = daysElapsed
    const averageVelocity = currentDay > 0 ? currentCompleted / currentDay : 0
    
    // Predict completion date based on current velocity
    let predictedCompletionDay = null
    let predictedCompletionDate = null
    
    if (averageVelocity > 0) {
      predictedCompletionDay = Math.ceil(totalStoryPoints / averageVelocity)
      if (predictedCompletionDay <= totalDays) {
        const predDate = new Date(startDate)
        predDate.setDate(predDate.getDate() + predictedCompletionDay)
        predictedCompletionDate = predDate.toISOString().split('T')[0]
      }
    }

    // Calculate sprint metrics
    const sprintMetrics = {
      totalStoryPoints,
      completedStoryPoints: currentCompleted,
      remainingStoryPoints: totalStoryPoints - currentCompleted,
      totalDays,
      daysElapsed: Math.max(0, currentDay),
      daysRemaining: Math.max(0, totalDays - currentDay),
      averageVelocity: Math.round(averageVelocity * 100) / 100,
      predictedCompletionDay,
      predictedCompletionDate,
      isOnTrack: currentDay > 0 ? currentCompleted >= (totalStoryPoints * currentDay / totalDays) : true,
      progress: totalStoryPoints > 0 ? Math.round((currentCompleted / totalStoryPoints) * 100) : 0
    }

    // Task breakdown by status
    const taskBreakdown = {
      todo: sprint.tasks.filter(t => t.status === 'TODO').length,
      inProgress: sprint.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: sprint.tasks.filter(t => t.status === 'REVIEW').length,
      done: sprint.tasks.filter(t => t.status === 'DONE').length,
      cancelled: sprint.tasks.filter(t => t.status === 'CANCELLED').length,
    }

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        project: sprint.project
      },
      burndownData,
      idealBurndownData,
      metrics: sprintMetrics,
      taskBreakdown
    })

  } catch (error) {
    console.error('Get burndown data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch burndown data' },
      { status: 500 }
    )
  }
}
