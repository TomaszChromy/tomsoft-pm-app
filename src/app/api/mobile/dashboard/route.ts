import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mobile/dashboard - Mobile-optimized dashboard data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get current date for filtering
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000))
    const endOfWeek = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000))

    // Fetch dashboard data in parallel for better mobile performance
    const [
      userStats,
      recentTasks,
      todayTasks,
      upcomingDeadlines,
      activeProjects,
      recentActivity,
      timeToday
    ] = await Promise.all([
      // User statistics
      getUserStats(user.id),
      
      // Recent tasks (last 5)
      prisma.task.findMany({
        where: {
          assigneeId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      
      // Today's tasks
      prisma.task.findMany({
        where: {
          assigneeId: user.id,
          dueDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      
      // Upcoming deadlines (next 7 days)
      prisma.task.findMany({
        where: {
          assigneeId: user.id,
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          status: { not: 'DONE' }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 10
      }),
      
      // Active projects
      prisma.project.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { team: { some: { id: user.id } } }
          ],
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: {
              tasks: {
                where: { status: { not: 'DONE' } }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      
      // Recent activity
      prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Time logged today
      prisma.timeEntry.aggregate({
        where: {
          userId: user.id,
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        _sum: {
          hours: true
        }
      })
    ])

    // Format data for mobile consumption
    const dashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role
      },
      
      stats: {
        ...userStats,
        timeToday: Number(timeToday._sum.hours) || 0
      },
      
      tasks: {
        recent: recentTasks.map(formatTaskForMobile),
        today: todayTasks.map(formatTaskForMobile),
        upcoming: upcomingDeadlines.map(formatTaskForMobile)
      },
      
      projects: {
        active: activeProjects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          openTasks: project._count.tasks,
          updatedAt: project.updatedAt
        }))
      },
      
      activity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt
      })),
      
      notifications: await getUnreadNotifications(user.id),
      
      quickActions: [
        { id: 'create_task', label: 'Create Task', icon: 'plus' },
        { id: 'log_time', label: 'Log Time', icon: 'clock' },
        { id: 'view_projects', label: 'Projects', icon: 'folder' },
        { id: 'team_chat', label: 'Team', icon: 'users' }
      ]
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Mobile dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}

async function getUserStats(userId: string) {
  const [
    totalTasks,
    completedTasks,
    totalProjects,
    activeProjects,
    thisWeekHours
  ] = await Promise.all([
    prisma.task.count({
      where: { assigneeId: userId }
    }),
    
    prisma.task.count({
      where: { 
        assigneeId: userId,
        status: 'DONE'
      }
    }),
    
    prisma.project.count({
      where: {
        OR: [
          { ownerId: userId },
          { team: { some: { id: userId } } }
        ]
      }
    }),
    
    prisma.project.count({
      where: {
        OR: [
          { ownerId: userId },
          { team: { some: { id: userId } } }
        ],
        status: 'ACTIVE'
      }
    }),
    
    prisma.timeEntry.aggregate({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: {
        hours: true
      }
    })
  ])

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalProjects,
    activeProjects,
    thisWeekHours: Number(thisWeekHours._sum.hours) || 0
  }
}

function formatTaskForMobile(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    project: task.project ? {
      id: task.project.id,
      name: task.project.name,
      status: task.project.status
    } : null,
    isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }
}

async function getUnreadNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt
  }))
}
