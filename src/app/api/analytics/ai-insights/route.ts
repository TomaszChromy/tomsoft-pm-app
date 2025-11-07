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

    // Get projects data
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        members: {
          include: {
            user: true
          }
        }
      }
    })

    // Get tasks data
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: true,
        project: true
      }
    })

    // Get team members data
    const teamMembers = await prisma.user.findMany({
      include: {
        assignedTasks: true,
        timeEntries: true
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

    const taskData: TaskData[] = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      assignedTo: task.assignedTo?.firstName + ' ' + task.assignedTo?.lastName || 'Unassigned',
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt?.toISOString()
    }))

    const teamMemberData: TeamMemberData[] = teamMembers.map(member => {
      const completedTasks = member.assignedTasks.filter(t => t.status === 'DONE').length
      const totalHours = member.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
      const efficiency = completedTasks > 0 ? Math.min(100, (completedTasks / member.assignedTasks.length) * 100) : 0
      const workload = member.assignedTasks.filter(t => t.status !== 'DONE').length * 10 // Simplified workload calculation

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        role: member.role,
        tasksCompleted: completedTasks,
        hoursLogged: totalHours,
        efficiency,
        workload
      }
    })

    // Generate AI insights
    const insights = await AIAnalyticsService.generateInsights(
      projectData,
      taskData,
      teamMemberData
    )

    return NextResponse.json({
      insights,
      dataPoints: {
        projectsAnalyzed: projectData.length,
        tasksAnalyzed: taskData.length,
        teamMembersAnalyzed: teamMemberData.length
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
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
    const { projectIds, dateRange } = body

    // Get filtered data based on request
    let projectFilter = {}
    if (projectIds && projectIds.length > 0) {
      projectFilter = { id: { in: projectIds } }
    }

    const projects = await prisma.project.findMany({
      where: projectFilter,
      include: {
        tasks: {
          where: dateRange ? {
            createdAt: {
              gte: new Date(dateRange.from),
              lte: new Date(dateRange.to)
            }
          } : undefined
        },
        members: {
          include: {
            user: true
          }
        }
      }
    })

    // Transform and generate insights for filtered data
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

    const insights = await AIAnalyticsService.generateInsights(
      projectData,
      [], // Tasks will be included in project data
      [] // Team members will be included in project data
    )

    return NextResponse.json({
      insights,
      filters: {
        projectIds,
        dateRange
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Insights POST API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate filtered AI insights' },
      { status: 500 }
    )
  }
}
