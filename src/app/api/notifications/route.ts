import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'PROJECT_UPDATE', 'DEADLINE_REMINDER']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  actionUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  userIds: z.array(z.string()).optional(), // For sending to multiple users
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let whereClause: any = { userId: user.id }
    
    if (unreadOnly) {
      whereClause.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.notification.count({
      where: whereClause
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = createNotificationSchema.parse(body)

    // Only admins and project managers can create notifications for other users
    if (validatedData.userIds && !['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create notifications for other users' },
        { status: 403 }
      )
    }

    const notificationService = new NotificationService()
    const userIds = validatedData.userIds || [user.id]
    const createdNotifications = []

    for (const userId of userIds) {
      const notificationId = await notificationService.createNotification({
        userId,
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        priority: validatedData.priority,
        actionUrl: validatedData.actionUrl,
        metadata: validatedData.metadata,
      })
      
      createdNotifications.push(notificationId)
    }

    return NextResponse.json({
      success: true,
      notificationIds: createdNotifications
    }, { status: 201 })

  } catch (error) {
    console.error('Create notification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
