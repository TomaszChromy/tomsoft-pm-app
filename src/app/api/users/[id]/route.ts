import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional()
})

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Users can view their own profile, admins and PMs can view all
    if (user.id !== userId && !['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user with detailed stats
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true,
            comments: true,
            timeEntries: true
          }
        },
        assignedTasks: {
          include: {
            project: {
              select: { id: true, name: true, status: true }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 10
        },
        ownedProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            progress: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        },
        timeEntries: {
          include: {
            task: {
              select: { id: true, title: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate additional stats
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      completedTasksThisMonth,
      completedTasksLastMonth,
      hoursThisMonth,
      hoursLastMonth,
      activeTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
          updatedAt: { gte: thisMonth }
        }
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
          updatedAt: { gte: lastMonth, lt: thisMonth }
        }
      }),
      prisma.timeEntry.aggregate({
        where: {
          userId: userId,
          createdAt: { gte: thisMonth }
        },
        _sum: { hours: true }
      }),
      prisma.timeEntry.aggregate({
        where: {
          userId: userId,
          createdAt: { gte: lastMonth, lt: thisMonth }
        },
        _sum: { hours: true }
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
        }
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          dueDate: { lt: now }
        }
      })
    ])

    // Calculate performance metrics
    const taskCompletionRate = completedTasksLastMonth > 0 
      ? ((completedTasksThisMonth - completedTasksLastMonth) / completedTasksLastMonth) * 100
      : completedTasksThisMonth > 0 ? 100 : 0

    const hoursChangeRate = (hoursLastMonth._sum.hours || 0) > 0
      ? (((hoursThisMonth._sum.hours || 0) - (hoursLastMonth._sum.hours || 0)) / (hoursLastMonth._sum.hours || 0)) * 100
      : (hoursThisMonth._sum.hours || 0) > 0 ? 100 : 0

    const userProfile = {
      id: targetUser.id,
      email: targetUser.email,
      username: targetUser.username,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      role: targetUser.role,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      skills: targetUser.skills,
      hourlyRate: targetUser.hourlyRate,
      isActive: targetUser.isActive,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
      stats: {
        totalProjects: targetUser._count.ownedProjects,
        totalTasks: targetUser._count.assignedTasks,
        activeTasks,
        overdueTasks,
        completedTasksThisMonth,
        completedTasksLastMonth,
        totalComments: targetUser._count.comments,
        totalTimeEntries: targetUser._count.timeEntries,
        hoursThisMonth: hoursThisMonth._sum.hours || 0,
        hoursLastMonth: hoursLastMonth._sum.hours || 0,
        taskCompletionRate: Math.round(taskCompletionRate),
        hoursChangeRate: Math.round(hoursChangeRate)
      },
      recentTasks: targetUser.assignedTasks,
      ownedProjects: targetUser.ownedProjects,
      recentTimeEntries: targetUser.timeEntries
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Users can update their own profile, admins can update all
    if (user.id !== userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Non-admins cannot change role
    if (user.role !== 'ADMIN' && data.role) {
      delete data.role
    }

    // Check for email/username conflicts
    if (data.email || data.username) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.username ? [{ username: data.username }] : [])
              ]
            }
          ]
        }
      })

      if (conflictUser) {
        return NextResponse.json({ 
          error: 'User with this email or username already exists' 
        }, { status: 400 })
      }
    }

    // Hash password if provided
    if (data.password) {
      const bcrypt = require('bcryptjs')
      data.password = await bcrypt.hash(data.password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.id

    // Cannot delete yourself
    if (user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete - deactivate user instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
