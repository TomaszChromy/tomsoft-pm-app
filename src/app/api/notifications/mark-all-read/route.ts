import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Mark all unread notifications as read for the user
    const updatedNotifications = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      updatedCount: updatedNotifications.count
    })

  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
