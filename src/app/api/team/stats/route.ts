import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/team/stats - Get team statistics
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Only admins and project managers can view team stats
    if (!['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get basic team stats
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalTimeThisMonth,
      totalTimeLastMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.timeEntry.aggregate({
        where: { createdAt: { gte: thisMonth } },
        _sum: { hours: true }
      }),
      prisma.timeEntry.aggregate({
        where: { createdAt: { gte: lastMonth, lt: thisMonth } },
        _sum: { hours: true }
      })
    ])

    // Get user performance stats
    const userStats = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        _count: {
          select: {
            assignedTasks: true,
            timeEntries: true
          }
        }
      }
    })

    // Get detailed user performance for this month
    const userPerformance = await Promise.all(
      userStats.map(async (u) => {
        const [completedThisMonth, hoursThisMonth, activeTasks, overdueTasks] = await Promise.all([
          prisma.task.count({
            where: {
              assigneeId: u.id,
              status: 'DONE',
              updatedAt: { gte: thisMonth }
            }
          }),
          prisma.timeEntry.aggregate({
            where: {
              userId: u.id,
              createdAt: { gte: thisMonth }
            },
            _sum: { hours: true }
          }),
          prisma.task.count({
            where: {
              assigneeId: u.id,
              status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
            }
          }),
          prisma.task.count({
            where: {
              assigneeId: u.id,
              status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
              dueDate: { lt: now }
            }
          })
        ])

        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          avatar: u.avatar,
          totalTasks: u._count.assignedTasks,
          completedThisMonth,
          activeTasks,
          overdueTasks,
          hoursThisMonth: hoursThisMonth._sum.hours || 0,
          totalTimeEntries: u._count.timeEntries
        }
      })
    )

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { role: true }
    })

    // Get project status distribution
    const projectStatusDistribution = await prisma.project.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Get task status distribution
    const taskStatusDistribution = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Get workload distribution (tasks per user)
    const workloadDistribution = userPerformance.map(u => ({
      userId: u.id,
      name: u.name,
      activeTasks: u.activeTasks,
      workloadLevel: u.activeTasks <= 3 ? 'Low' : u.activeTasks <= 6 ? 'Medium' : 'High'
    }))

    // Calculate team productivity metrics
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const timeChangeRate = (totalTimeLastMonth._sum.hours || 0) > 0
      ? Math.round((((totalTimeThisMonth._sum.hours || 0) - (totalTimeLastMonth._sum.hours || 0)) / (totalTimeLastMonth._sum.hours || 0)) * 100)
      : (totalTimeThisMonth._sum.hours || 0) > 0 ? 100 : 0

    // Get top performers (by completed tasks this month)
    const topPerformers = userPerformance
      .filter(u => u.completedThisMonth > 0)
      .sort((a, b) => b.completedThisMonth - a.completedThisMonth)
      .slice(0, 5)

    // Get users with high workload (overloaded)
    const overloadedUsers = userPerformance
      .filter(u => u.activeTasks > 6 || u.overdueTasks > 0)
      .sort((a, b) => (b.activeTasks + b.overdueTasks) - (a.activeTasks + a.overdueTasks))

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = await prisma.task.findMany({
      where: {
        updatedAt: { gte: sevenDaysAgo },
        status: 'DONE'
      },
      include: {
        assignee: {
          select: { firstName: true, lastName: true }
        },
        project: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        completionRate,
        hoursThisMonth: totalTimeThisMonth._sum.hours || 0,
        hoursLastMonth: totalTimeLastMonth._sum.hours || 0,
        timeChangeRate
      },
      distributions: {
        roles: roleDistribution.map(r => ({
          role: r.role,
          count: r._count.role
        })),
        projectStatus: projectStatusDistribution.map(p => ({
          status: p.status,
          count: p._count.status
        })),
        taskStatus: taskStatusDistribution.map(t => ({
          status: t.status,
          count: t._count.status
        })),
        workload: workloadDistribution
      },
      performance: {
        topPerformers,
        overloadedUsers,
        userPerformance: userPerformance.sort((a, b) => b.completedThisMonth - a.completedThisMonth)
      },
      recentActivity: recentActivity.map(task => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned',
        project: task.project.name,
        completedAt: task.updatedAt
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching team stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
