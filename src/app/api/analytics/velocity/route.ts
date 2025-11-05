import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')
    const period = searchParams.get('period') || '6' // months

    let whereClause: any = {}

    // Filter by project if specified
    if (projectId) {
      whereClause.projectId = projectId
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

    // Get completed sprints from the last X months
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(period))

    const sprints = await prisma.sprint.findMany({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        endDate: {
          gte: monthsAgo
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        tasks: {
          where: {
            status: 'DONE',
            completedAt: {
              not: null
            }
          },
          select: {
            id: true,
            storyPoints: true,
            completedAt: true,
            assigneeId: true,
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    // Calculate velocity data
    const velocityData = sprints.map(sprint => {
      const completedStoryPoints = sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
      const sprintDuration = Math.ceil(
        (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Calculate team member contributions
      const teamContributions = sprint.tasks.reduce((acc, task) => {
        if (task.assigneeId && task.assignee) {
          const memberId = task.assigneeId
          const memberName = `${task.assignee.firstName} ${task.assignee.lastName}`
          
          if (!acc[memberId]) {
            acc[memberId] = {
              id: memberId,
              name: memberName,
              storyPoints: 0,
              tasksCompleted: 0
            }
          }
          
          acc[memberId].storyPoints += task.storyPoints || 0
          acc[memberId].tasksCompleted += 1
        }
        return acc
      }, {} as Record<string, any>)

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        projectName: sprint.project.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        duration: sprintDuration,
        completedStoryPoints,
        totalTasks: sprint.tasks.length,
        velocity: sprintDuration > 0 ? Math.round((completedStoryPoints / sprintDuration) * 100) / 100 : 0,
        teamContributions: Object.values(teamContributions)
      }
    })

    // Calculate overall statistics
    const totalStoryPoints = velocityData.reduce((sum, sprint) => sum + sprint.completedStoryPoints, 0)
    const totalSprints = velocityData.length
    const averageVelocity = totalSprints > 0 
      ? Math.round((velocityData.reduce((sum, sprint) => sum + sprint.velocity, 0) / totalSprints) * 100) / 100 
      : 0

    // Calculate trend (last 3 sprints vs previous 3 sprints)
    let trend = 'stable'
    if (velocityData.length >= 6) {
      const recent3 = velocityData.slice(-3)
      const previous3 = velocityData.slice(-6, -3)
      
      const recentAvg = recent3.reduce((sum, s) => sum + s.velocity, 0) / 3
      const previousAvg = previous3.reduce((sum, s) => sum + s.velocity, 0) / 3
      
      const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100
      
      if (changePercent > 10) trend = 'improving'
      else if (changePercent < -10) trend = 'declining'
    }

    // Team performance analysis
    const teamPerformance = velocityData.reduce((acc, sprint) => {
      sprint.teamContributions.forEach((member: any) => {
        if (!acc[member.id]) {
          acc[member.id] = {
            id: member.id,
            name: member.name,
            totalStoryPoints: 0,
            totalTasks: 0,
            sprintsParticipated: 0,
            averageVelocity: 0
          }
        }
        
        acc[member.id].totalStoryPoints += member.storyPoints
        acc[member.id].totalTasks += member.tasksCompleted
        acc[member.id].sprintsParticipated += 1
      })
      return acc
    }, {} as Record<string, any>)

    // Calculate average velocity per team member
    Object.values(teamPerformance).forEach((member: any) => {
      member.averageVelocity = member.sprintsParticipated > 0 
        ? Math.round((member.totalStoryPoints / member.sprintsParticipated) * 100) / 100
        : 0
    })

    // Predictive analysis
    const lastSprintVelocity = velocityData.length > 0 ? velocityData[velocityData.length - 1].velocity : 0
    const predictedCapacity = {
      nextSprint: lastSprintVelocity,
      next2Weeks: lastSprintVelocity * 2,
      nextMonth: lastSprintVelocity * 4
    }

    return NextResponse.json({
      velocityData,
      statistics: {
        totalStoryPoints,
        totalSprints,
        averageVelocity,
        trend,
        lastSprintVelocity,
        periodMonths: parseInt(period)
      },
      teamPerformance: Object.values(teamPerformance),
      predictedCapacity
    })

  } catch (error) {
    console.error('Get velocity data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch velocity data' },
      { status: 500 }
    )
  }
}
