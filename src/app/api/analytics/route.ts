import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json({ error: 'Date range is required' }, { status: 400 })
    }

    // Return mock analytics data
    const totalProjects = 6
    const completedTasks = 6
    const totalTasks = 16
    const totalHours = 120

    // All data is now mocked for simplicity

    return NextResponse.json({
      overview: {
        totalProjects,
        completedTasks,
        totalTasks,
        totalHours,
        budgetUtilization: 45
      },
      projectProgress: [
        { name: 'Website Redesign', progress: 75, tasksCompleted: 6, totalTasks: 8, budget: 50000, spent: 35000 },
        { name: 'Mobile App', progress: 60, tasksCompleted: 3, totalTasks: 5, budget: 80000, spent: 45000 }
      ],
      taskStatus: [
        { status: 'TODO', count: 4, percentage: 25 },
        { status: 'IN_PROGRESS', count: 6, percentage: 37.5 },
        { status: 'DONE', count: 6, percentage: 37.5 }
      ],
      teamPerformance: [
        { name: 'Admin TomSoft', tasksCompleted: 5, hoursLogged: 40, efficiency: 85, avatar: null },
        { name: 'Jan Developer', tasksCompleted: 8, hoursLogged: 35, efficiency: 92, avatar: null }
      ],
      timeTracking: [
        { date: '2025-11-01', hours: 8, project: 'Website Redesign', user: 'Admin TomSoft' },
        { date: '2025-11-02', hours: 6, project: 'Mobile App', user: 'Jan Developer' }
      ],
      budgetAnalysis: [
        { project: 'Website Redesign', budget: 50000, spent: 35000, remaining: 15000, utilization: 70 },
        { project: 'Mobile App', budget: 80000, spent: 45000, remaining: 35000, utilization: 56 }
      ],
      projects: [
        { id: '1', name: 'Website Redesign' },
        { id: '2', name: 'Mobile App' }
      ],
      teamMembers: [
        { id: '1', firstName: 'Admin', lastName: 'TomSoft' },
        { id: '2', firstName: 'Jan', lastName: 'Developer' }
      ]
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
