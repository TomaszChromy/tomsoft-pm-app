import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const generateReportSchema = z.object({
  type: z.enum(['PROJECT_SUMMARY', 'TIME_TRACKING', 'TEAM_PERFORMANCE', 'SPRINT_ANALYSIS', 'CUSTOM']),
  filters: z.object({
    projectIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    sprintIds: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
  }).optional(),
  metrics: z.array(z.string()).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = generateReportSchema.parse(body)
    const { type, filters, metrics, groupBy, sortBy, sortOrder } = validatedData

    let reportData: any = {}

    switch (type) {
      case 'PROJECT_SUMMARY':
        reportData = await generateProjectSummaryReport(user, filters)
        break
      case 'TIME_TRACKING':
        reportData = await generateTimeTrackingReport(user, filters)
        break
      case 'TEAM_PERFORMANCE':
        reportData = await generateTeamPerformanceReport(user, filters)
        break
      case 'SPRINT_ANALYSIS':
        reportData = await generateSprintAnalysisReport(user, filters)
        break
      case 'CUSTOM':
        reportData = await generateCustomReport(user, filters, metrics, groupBy, sortBy, sortOrder)
        break
      default:
        throw new Error('Invalid report type')
    }

    return NextResponse.json({
      type,
      filters,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
      }
    })

  } catch (error) {
    console.error('Generate report error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function generateProjectSummaryReport(user: any, filters: any) {
  let whereClause: any = {}

  // Apply filters
  if (filters?.projectIds?.length) {
    whereClause.id = { in: filters.projectIds }
  }

  if (filters?.dateFrom || filters?.dateTo) {
    whereClause.createdAt = {}
    if (filters.dateFrom) whereClause.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) whereClause.createdAt.lte = new Date(filters.dateTo)
  }

  // Check user access
  if (user.role !== 'ADMIN') {
    whereClause.OR = [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } }
    ]
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      owner: {
        select: { firstName: true, lastName: true }
      },
      tasks: {
        select: {
          status: true,
          priority: true,
          storyPoints: true,
          estimatedHours: true,
          actualHours: true,
        }
      },
      timeEntries: {
        select: {
          hours: true,
          billable: true,
          hourlyRate: true,
        }
      },
      _count: {
        select: {
          tasks: true,
          members: true,
          sprints: true,
        }
      }
    }
  })

  return projects.map(project => {
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
    const totalStoryPoints = project.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const completedStoryPoints = project.tasks
      .filter(t => t.status === 'DONE')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    
    const totalHours = project.timeEntries.reduce((sum, t) => sum + Number(t.hours), 0)
    const billableHours = project.timeEntries
      .filter(t => t.billable)
      .reduce((sum, t) => sum + Number(t.hours), 0)
    
    const totalEarnings = project.timeEntries
      .filter(t => t.billable && t.hourlyRate)
      .reduce((sum, t) => sum + (Number(t.hours) * Number(t.hourlyRate)), 0)

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      owner: `${project.owner.firstName} ${project.owner.lastName}`,
      progress: project.progress,
      budget: project.budget,
      spent: project.spent,
      tasks: {
        total: project._count.tasks,
        completed: completedTasks,
        completionRate: project._count.tasks > 0 ? Math.round((completedTasks / project._count.tasks) * 100) : 0
      },
      storyPoints: {
        total: totalStoryPoints,
        completed: completedStoryPoints,
        completionRate: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
      },
      timeTracking: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100
      },
      team: {
        members: project._count.members,
        sprints: project._count.sprints
      }
    }
  })
}

async function generateTimeTrackingReport(user: any, filters: any) {
  let whereClause: any = {}

  // Apply filters
  if (filters?.projectIds?.length) {
    whereClause.projectId = { in: filters.projectIds }
  }

  if (filters?.userIds?.length) {
    whereClause.userId = { in: filters.userIds }
  }

  if (filters?.dateFrom || filters?.dateTo) {
    whereClause.date = {}
    if (filters.dateFrom) whereClause.date.gte = new Date(filters.dateFrom)
    if (filters.dateTo) whereClause.date.lte = new Date(filters.dateTo)
  }

  // Check user access
  if (user.role !== 'ADMIN') {
    whereClause.project = {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where: whereClause,
    include: {
      user: {
        select: { firstName: true, lastName: true }
      },
      project: {
        select: { name: true }
      },
      task: {
        select: { title: true }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Group by user
  const userSummary = timeEntries.reduce((acc, entry) => {
    const userId = entry.userId
    const userName = `${entry.user.firstName} ${entry.user.lastName}`
    
    if (!acc[userId]) {
      acc[userId] = {
        id: userId,
        name: userName,
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        totalEarnings: 0,
        entriesCount: 0
      }
    }
    
    const hours = Number(entry.hours)
    acc[userId].totalHours += hours
    acc[userId].entriesCount += 1
    
    if (entry.billable) {
      acc[userId].billableHours += hours
      if (entry.hourlyRate) {
        acc[userId].totalEarnings += hours * Number(entry.hourlyRate)
      }
    } else {
      acc[userId].nonBillableHours += hours
    }
    
    return acc
  }, {} as Record<string, any>)

  return {
    entries: timeEntries.map(entry => ({
      id: entry.id,
      description: entry.description,
      hours: Number(entry.hours),
      date: entry.date,
      billable: entry.billable,
      hourlyRate: entry.hourlyRate ? Number(entry.hourlyRate) : null,
      user: `${entry.user.firstName} ${entry.user.lastName}`,
      project: entry.project.name,
      task: entry.task?.title || null,
      tags: entry.tags ? entry.tags.split(',').filter(t => t.trim()) : []
    })),
    summary: {
      totalEntries: timeEntries.length,
      totalHours: timeEntries.reduce((sum, e) => sum + Number(e.hours), 0),
      billableHours: timeEntries.filter(e => e.billable).reduce((sum, e) => sum + Number(e.hours), 0),
      totalEarnings: timeEntries
        .filter(e => e.billable && e.hourlyRate)
        .reduce((sum, e) => sum + (Number(e.hours) * Number(e.hourlyRate)), 0)
    },
    userSummary: Object.values(userSummary)
  }
}

async function generateTeamPerformanceReport(user: any, filters: any) {
  // Implementation for team performance report
  return { message: 'Team performance report not yet implemented' }
}

async function generateSprintAnalysisReport(user: any, filters: any) {
  // Implementation for sprint analysis report
  return { message: 'Sprint analysis report not yet implemented' }
}

async function generateCustomReport(user: any, filters: any, metrics: any, groupBy: any, sortBy: any, sortOrder: any) {
  // Implementation for custom report
  return { message: 'Custom report not yet implemented' }
}
