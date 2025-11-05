import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// Schema for notification rule
const notificationRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  conditions: z.object({
    projectIds: z.array(z.string()).optional(),
    taskTypes: z.array(z.string()).optional(),
    priorities: z.array(z.string()).optional(),
    assigneeIds: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    timeConditions: z.object({
      startTime: z.string().optional(), // HH:MM format
      endTime: z.string().optional(),   // HH:MM format
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
    }).optional(),
  }),
  actions: z.object({
    sendEmail: z.boolean().default(false),
    sendPush: z.boolean().default(false),
    sendSlack: z.boolean().default(false),
    sendSMS: z.boolean().default(false),
    customMessage: z.string().optional(),
    delay: z.number().min(0).optional(), // Delay in minutes
  }),
})

// GET /api/notifications/rules - Get all notification rules for user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const rules = await prisma.notificationRule.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Get notification rules error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification rules' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/rules - Create new notification rule
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validatedData = notificationRuleSchema.parse(body)

    const rule = await prisma.notificationRule.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        conditions: JSON.stringify(validatedData.conditions),
        actions: JSON.stringify(validatedData.actions),
      }
    })

    return NextResponse.json({ rule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create notification rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification rule' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/rules - Update notification rule
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    const validatedData = notificationRuleSchema.parse(updateData)

    // Check if rule belongs to user
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }

    const rule = await prisma.notificationRule.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isActive: validatedData.isActive,
        conditions: JSON.stringify(validatedData.conditions),
        actions: JSON.stringify(validatedData.actions),
      }
    })

    return NextResponse.json({ rule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update notification rule error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification rule' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/rules - Delete notification rule
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    // Check if rule belongs to user
    const existingRule = await prisma.notificationRule.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }

    await prisma.notificationRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete notification rule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification rule' },
      { status: 500 }
    )
  }
}
