import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { AIAnalyticsService, ProjectData, TaskData, TeamMemberData } from '@/lib/ai-analytics'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Get data for predictions
    let projectFilter = {}
    if (projectId) {
      projectFilter = { id: projectId }
    }

    const projects = await prisma.project.findMany({
      where: projectFilter,
      include: {
        tasks: {
          include: {
            assignedTo: true,
            timeEntries: true
          }
        },
        members: {
          include: {
            user: {
              include: {
                assignedTasks: true,
                timeEntries: true
              }
            }
          }
        }
      }
    })

    if (projects.length === 0) {
      return NextResponse.json({ error: 'No projects found' }, { status: 404 })
    }

    // Transform data for AI analysis
    const projectData: ProjectData[] = projects.map(project => {
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
      const totalTasks = project.tasks.length
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progress,
        budget: project.budget || 0,
        spent: project.spent || 0,
        deadline: project.deadline?.toISOString() || '',
        tasksCompleted: completedTasks,
        totalTasks,
        teamSize: project.members.length,
        startDate: project.createdAt.toISOString()
      }
    })

    const taskData: TaskData[] = projects.flatMap(project => 
      project.tasks.map(task => {
        const actualHours = task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
        
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          estimatedHours: task.estimatedHours || 0,
          actualHours,
          assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned',
          createdAt: task.createdAt.toISOString(),
          completedAt: task.completedAt?.toISOString()
        }
      })
    )

    const teamMemberData: TeamMemberData[] = projects.flatMap(project =>
      project.members.map(member => {
        const user = member.user
        const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE').length
        const totalHours = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
        const efficiency = user.assignedTasks.length > 0 ? 
          Math.min(100, (completedTasks / user.assignedTasks.length) * 100) : 0
        const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE').length
        const workload = Math.min(100, activeTasks * 15)

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tasksCompleted: completedTasks,
          hoursLogged: totalHours,
          efficiency,
          workload
        }
      })
    )

    // Remove duplicates from team members
    const uniqueTeamMembers = teamMemberData.filter((member, index, self) =>
      index === self.findIndex(m => m.id === member.id)
    )

    // Generate predictive analysis
    const predictions = await AIAnalyticsService.generatePredictiveAnalysis(
      projectData,
      taskData,
      uniqueTeamMembers
    )

    // Calculate additional metrics
    const velocityData = calculateVelocity(taskData)
    const riskAssessment = calculateRiskAssessment(projectData, taskData, uniqueTeamMembers)

    return NextResponse.json({
      predictions,
      velocity: velocityData,
      riskAssessment,
      dataPoints: {
        projectsAnalyzed: projectData.length,
        tasksAnalyzed: taskData.length,
        teamMembersAnalyzed: uniqueTeamMembers.length
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Predictions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI predictions' },
      { status: 500 }
    )
  }
}

function calculateVelocity(tasks: TaskData[]) {
  const completedTasks = tasks.filter(t => t.status === 'DONE' && t.completedAt)
  
  if (completedTasks.length === 0) {
    return {
      averageCompletionTime: 0,
      tasksPerWeek: 0,
      trend: 'stable' as const
    }
  }

  // Calculate average completion time
  const completionTimes = completedTasks.map(task => {
    const created = new Date(task.createdAt)
    const completed = new Date(task.completedAt!)
    return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
  })

  const averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length

  // Calculate tasks per week (last 4 weeks)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const recentCompletedTasks = completedTasks.filter(task => 
    new Date(task.completedAt!) >= fourWeeksAgo
  )
  const tasksPerWeek = recentCompletedTasks.length / 4

  // Determine trend (simplified)
  const firstHalf = recentCompletedTasks.slice(0, Math.floor(recentCompletedTasks.length / 2))
  const secondHalf = recentCompletedTasks.slice(Math.floor(recentCompletedTasks.length / 2))
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (secondHalf.length > firstHalf.length * 1.2) {
    trend = 'increasing'
  } else if (secondHalf.length < firstHalf.length * 0.8) {
    trend = 'decreasing'
  }

  return {
    averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    tasksPerWeek: Math.round(tasksPerWeek * 10) / 10,
    trend
  }
}

function calculateRiskAssessment(
  projects: ProjectData[],
  tasks: TaskData[],
  teamMembers: TeamMemberData[]
) {
  const risks = []

  // Budget risk
  const budgetRisk = projects.filter(p => p.spent > p.budget * 0.8).length / projects.length
  if (budgetRisk > 0.3) {
    risks.push({
      type: 'budget',
      level: budgetRisk > 0.6 ? 'high' : 'medium',
      description: `${Math.round(budgetRisk * 100)}% of projects are approaching budget limits`,
      mitigation: 'Review budget allocation and optimize resource usage'
    })
  }

  // Timeline risk
  const overdueTasks = tasks.filter(t => {
    if (!t.completedAt && t.status !== 'DONE') {
      // Simplified: assume task should be done if created more than 7 days ago
      const created = new Date(t.createdAt)
      const now = new Date()
      return (now.getTime() - created.getTime()) > (7 * 24 * 60 * 60 * 1000)
    }
    return false
  })
  
  const timelineRisk = overdueTasks.length / tasks.length
  if (timelineRisk > 0.2) {
    risks.push({
      type: 'timeline',
      level: timelineRisk > 0.4 ? 'high' : 'medium',
      description: `${Math.round(timelineRisk * 100)}% of tasks are overdue`,
      mitigation: 'Reassess task priorities and deadlines'
    })
  }

  // Team workload risk
  const overloadedMembers = teamMembers.filter(m => m.workload > 80)
  const workloadRisk = overloadedMembers.length / teamMembers.length
  if (workloadRisk > 0.3) {
    risks.push({
      type: 'workload',
      level: workloadRisk > 0.5 ? 'high' : 'medium',
      description: `${Math.round(workloadRisk * 100)}% of team members are overloaded`,
      mitigation: 'Redistribute tasks or add additional resources'
    })
  }

  return {
    overallRisk: risks.length > 0 ? 
      (risks.filter(r => r.level === 'high').length > 0 ? 'high' : 'medium') : 'low',
    risks,
    riskScore: Math.min(100, (budgetRisk + timelineRisk + workloadRisk) * 33.33)
  }
}
