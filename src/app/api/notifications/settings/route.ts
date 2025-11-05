import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const notificationSettingsSchema = z.object({
  // Email settings
  emailEnabled: z.boolean().optional(),
  emailTaskAssigned: z.boolean().optional(),
  emailTaskCompleted: z.boolean().optional(),
  emailProjectUpdate: z.boolean().optional(),
  emailDeadlineReminder: z.boolean().optional(),
  emailDigestFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
  
  // Push settings
  pushEnabled: z.boolean().optional(),
  pushTaskAssigned: z.boolean().optional(),
  pushTaskCompleted: z.boolean().optional(),
  pushProjectUpdate: z.boolean().optional(),
  pushDeadlineReminder: z.boolean().optional(),
  
  // Slack settings
  slackEnabled: z.boolean().optional(),
  slackWebhookUrl: z.string().optional(),
  slackChannel: z.string().optional(),
  slackTaskAssigned: z.boolean().optional(),
  slackTaskCompleted: z.boolean().optional(),
  slackProjectUpdate: z.boolean().optional(),
  
  // SMS settings
  smsEnabled: z.boolean().optional(),
  smsPhoneNumber: z.string().optional(),
  smsUrgentOnly: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
    })

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId: user.id }
      })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = notificationSettingsSchema.parse(body)

    // Get or create settings
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
    })

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { 
          userId: user.id,
          ...validatedData
        }
      })
    } else {
      settings = await prisma.notificationSettings.update({
        where: { userId: user.id },
        data: validatedData
      })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Update notification settings error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
