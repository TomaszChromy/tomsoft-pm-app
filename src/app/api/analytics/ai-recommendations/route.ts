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

    // Get comprehensive data for recommendations
    const projects = await prisma.project.findMany({
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

    // Transform data for AI analysis
    const projectData: ProjectData[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress || 0,
      budget: project.budget || 0,
      spent: project.spent || 0,
      deadline: project.deadline?.toISOString() || '',
      tasksCompleted: project.tasks.filter(t => t.status === 'DONE').length,
      totalTasks: project.tasks.length,
      teamSize: project.members.length,
      startDate: project.createdAt.toISOString()
    }))

    const taskData: TaskData[] = projects.flatMap(project => 
      project.tasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
        assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned',
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString()
      }))
    )

    const teamMemberData: TeamMemberData[] = projects.flatMap(project =>
      project.members.map(member => {
        const user = member.user
        const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE').length
        const totalHours = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
        const efficiency = user.assignedTasks.length > 0 ? 
          Math.min(100, (completedTasks / user.assignedTasks.length) * 100) : 0
        const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE').length
        const workload = Math.min(100, activeTasks * 15) // Simplified workload calculation

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

    // Generate AI recommendations
    const recommendations = await AIAnalyticsService.generateRecommendations(
      projectData,
      taskData,
      uniqueTeamMembers
    )

    return NextResponse.json({
      recommendations,
      dataAnalysis: {
        projectsAnalyzed: projectData.length,
        tasksAnalyzed: taskData.length,
        teamMembersAnalyzed: uniqueTeamMembers.length,
        totalBudget: projectData.reduce((sum, p) => sum + p.budget, 0),
        totalSpent: projectData.reduce((sum, p) => sum + p.spent, 0),
        averageProgress: projectData.length > 0 ? 
          projectData.reduce((sum, p) => sum + p.progress, 0) / projectData.length : 0
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, priority, projectIds } = body

    // Get filtered data
    let projectFilter = {}
    if (projectIds && projectIds.length > 0) {
      projectFilter = { id: { in: projectIds } }
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

    // Transform data
    const projectData: ProjectData[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress || 0,
      budget: project.budget || 0,
      spent: project.spent || 0,
      deadline: project.deadline?.toISOString() || '',
      tasksCompleted: project.tasks.filter(t => t.status === 'DONE').length,
      totalTasks: project.tasks.length,
      teamSize: project.members.length,
      startDate: project.createdAt.toISOString()
    }))

    // Generate recommendations
    const allRecommendations = await AIAnalyticsService.generateRecommendations(
      projectData,
      [],
      []
    )

    // Filter recommendations based on request
    let filteredRecommendations = allRecommendations

    if (category) {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.category === category)
    }

    if (priority) {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.priority === priority)
    }

    return NextResponse.json({
      recommendations: filteredRecommendations,
      filters: {
        category,
        priority,
        projectIds
      },
      totalRecommendations: allRecommendations.length,
      filteredCount: filteredRecommendations.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Recommendations POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate filtered AI recommendations' },
      { status: 500 }
    )
  }
}
