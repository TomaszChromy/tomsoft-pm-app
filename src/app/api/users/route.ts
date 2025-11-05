import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']),
  password: z.string().min(6),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true)
})

// GET /api/users - Get all users with filters
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and project managers can view all users
    if (!['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const whereClause: any = {}

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    if (query.role) {
      whereClause.role = query.role
    }

    // Get users with stats
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Return simplified user data
    const usersWithStats = users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLogin,
          stats: {
            totalProjects: 0,
            totalTasks: 0,
            activeTasks: 0,
            completedTasksThisMonth: 0,
            totalComments: 0,
            totalTimeEntries: 0,
            hoursThisMonth: 0
          }
        }
    })

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email or username already exists' 
      }, { status: 400 })
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
