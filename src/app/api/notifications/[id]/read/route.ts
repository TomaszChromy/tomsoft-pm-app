import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const notificationId = params.id

    // Update notification as read (only if it belongs to the user)
    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id
      },
      data: {
        isRead: true
      }
    })

    if (updatedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
