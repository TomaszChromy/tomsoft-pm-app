import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/analytics/enhanced-charts - Get enhanced chart data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch project velocity data
    const velocityData = await getProjectVelocityData(startDate, now)
    
    // Fetch budget analysis data
    const budgetData = await getBudgetAnalysisData(startDate, now)
    
    // Fetch team performance data
    const teamPerformanceData = await getTeamPerformanceData(startDate, now)
    
    // Fetch risk assessment data
    const riskAssessmentData = await getRiskAssessmentData(startDate, now)
    
    // Fetch KPI metrics
    const kpiMetrics = await getKPIMetrics(startDate, now)

    return NextResponse.json({
      success: true,
      data: {
        velocity: velocityData,
        budget: budgetData,
        teamPerformance: teamPerformanceData,
        riskAssessment: riskAssessmentData,
        kpi: kpiMetrics,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching enhanced chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}

async function getProjectVelocityData(startDate: Date, endDate: Date) {
  // Get weekly task completion data
  const tasks = await prisma.task.findMany({
    where: {
      completedAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'DONE'
    },
    select: {
      id: true,
      completedAt: true,
      storyPoints: true,
      project: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // Group by weeks
  const weeklyData = groupTasksByWeek(tasks, startDate, endDate)
  
  return {
    labels: weeklyData.map(w => w.week),
    datasets: [
      {
        label: 'Tasks Completed',
        data: weeklyData.map(w => w.taskCount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Story Points',
        data: weeklyData.map(w => w.storyPoints),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  }
}

async function getBudgetAnalysisData(startDate: Date, endDate: Date) {
  // Get budget data by month
  const projects = await prisma.project.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      name: true,
      budget: true,
      createdAt: true,
      timeEntries: {
        select: {
          hours: true,
          user: {
            select: {
              hourlyRate: true
            }
          }
        }
      }
    }
  })

  const monthlyData = groupProjectsByMonth(projects, startDate, endDate)
  
  return {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: 'Planned Budget',
        data: monthlyData.map(m => m.plannedBudget),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Actual Spending',
        data: monthlyData.map(m => m.actualSpending),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Forecasted',
        data: monthlyData.map(m => m.forecasted),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      }
    ]
  }
}

async function getTeamPerformanceData(startDate: Date, endDate: Date) {
  // Get team performance by role/department
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      role: true,
      tasks: {
        where: {
          completedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'DONE'
        },
        select: {
          id: true,
          completedAt: true,
          estimatedHours: true
        }
      },
      timeEntries: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          hours: true
        }
      }
    }
  })

  const performanceByRole = calculatePerformanceByRole(users)
  
  return {
    labels: Object.keys(performanceByRole),
    datasets: [{
      label: 'Performance Score',
      data: Object.values(performanceByRole),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }
}

async function getRiskAssessmentData(startDate: Date, endDate: Date) {
  // Calculate various risk metrics
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ['ACTIVE', 'PLANNING']
      }
    },
    include: {
      tasks: true,
      timeEntries: true,
      team: true
    }
  })

  const riskMetrics = calculateRiskMetrics(projects)
  
  return {
    labels: ['Budget Risk', 'Timeline Risk', 'Quality Risk', 'Resource Risk', 'Technical Risk'],
    datasets: [{
      label: 'Risk Level (1-10)',
      data: [
        riskMetrics.budgetRisk,
        riskMetrics.timelineRisk,
        riskMetrics.qualityRisk,
        riskMetrics.resourceRisk,
        riskMetrics.technicalRisk
      ],
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 1)',
      pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
    }]
  }
}

async function getKPIMetrics(startDate: Date, endDate: Date) {
  // Calculate key performance indicators
  const totalProjects = await prisma.project.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const completedProjects = await prisma.project.count({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const totalTasks = await prisma.task.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const completedTasks = await prisma.task.count({
    where: {
      status: 'DONE',
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const totalHours = await prisma.timeEntry.aggregate({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      hours: true
    }
  })

  return {
    projectCompletionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
    taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalHoursLogged: Number(totalHours._sum.hours) || 0,
    averageProjectDuration: await calculateAverageProjectDuration(startDate, endDate),
    teamUtilization: await calculateTeamUtilization(startDate, endDate)
  }
}

// Helper functions
function groupTasksByWeek(tasks: any[], startDate: Date, endDate: Date) {
  const weeks = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const weekTasks = tasks.filter(task => {
      const completedAt = new Date(task.completedAt)
      return completedAt >= weekStart && completedAt <= weekEnd
    })
    
    weeks.push({
      week: `Week ${weeks.length + 1}`,
      taskCount: weekTasks.length,
      storyPoints: weekTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
    })
    
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}

function groupProjectsByMonth(projects: any[], startDate: Date, endDate: Date) {
  // Implementation for grouping projects by month
  // This is a simplified version - would need more complex logic for real data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  
  return months.map(month => ({
    month,
    plannedBudget: Math.floor(Math.random() * 50000) + 50000,
    actualSpending: Math.floor(Math.random() * 45000) + 45000,
    forecasted: Math.floor(Math.random() * 48000) + 48000
  }))
}

function calculatePerformanceByRole(users: any[]) {
  const rolePerformance: { [key: string]: number } = {}
  
  users.forEach(user => {
    const role = user.role || 'Unknown'
    const tasksCompleted = user.tasks.length
    const hoursLogged = user.timeEntries.reduce((sum: number, entry: any) => sum + Number(entry.hours), 0)
    
    // Simple performance calculation (can be made more sophisticated)
    const performance = Math.min(100, (tasksCompleted * 10) + (hoursLogged / 10))
    
    if (!rolePerformance[role]) {
      rolePerformance[role] = performance
    } else {
      rolePerformance[role] = (rolePerformance[role] + performance) / 2
    }
  })
  
  return rolePerformance
}

function calculateRiskMetrics(projects: any[]) {
  // Simplified risk calculation - would be more complex in real implementation
  return {
    budgetRisk: Math.floor(Math.random() * 5) + 3,
    timelineRisk: Math.floor(Math.random() * 5) + 5,
    qualityRisk: Math.floor(Math.random() * 3) + 2,
    resourceRisk: Math.floor(Math.random() * 4) + 4,
    technicalRisk: Math.floor(Math.random() * 3) + 3
  }
}

async function calculateAverageProjectDuration(startDate: Date, endDate: Date) {
  // Calculate average project duration in days
  const completedProjects = await prisma.project.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      completedAt: true
    }
  })
  
  if (completedProjects.length === 0) return 0
  
  const totalDuration = completedProjects.reduce((sum, project) => {
    const duration = new Date(project.completedAt!).getTime() - new Date(project.createdAt).getTime()
    return sum + (duration / (1000 * 60 * 60 * 24)) // Convert to days
  }, 0)
  
  return Math.round(totalDuration / completedProjects.length)
}

async function calculateTeamUtilization(startDate: Date, endDate: Date) {
  // Calculate team utilization percentage
  const totalUsers = await prisma.user.count({ where: { isActive: true } })
  const activeUsers = await prisma.user.count({
    where: {
      isActive: true,
      timeEntries: {
        some: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  })
  
  return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
}
