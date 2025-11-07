import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TeamsIntegrationService } from '@/lib/teams-integration'
import { prisma } from '@/lib/prisma'

// POST /api/teams/webhook - Send notification to Teams
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { type, payload } = body
    
    let success = false
    let message = ''

    switch (type) {
      case 'project_notification':
        success = await TeamsIntegrationService.sendProjectNotification(payload)
        message = success ? 'Project notification sent to Teams' : 'Failed to send project notification'
        break
        
      case 'task_notification':
        success = await TeamsIntegrationService.sendTaskNotification(payload)
        message = success ? 'Task notification sent to Teams' : 'Failed to send task notification'
        break
        
      case 'budget_alert':
        success = await TeamsIntegrationService.sendBudgetAlert(
          payload.projectId,
          payload.projectName,
          payload.budgetData
        )
        message = success ? 'Budget alert sent to Teams' : 'Failed to send budget alert'
        break
        
      case 'daily_summary':
        success = await TeamsIntegrationService.sendDailySummary(payload)
        message = success ? 'Daily summary sent to Teams' : 'Failed to send daily summary'
        break
        
      case 'custom':
        success = await TeamsIntegrationService.sendNotification(payload)
        message = success ? 'Custom notification sent to Teams' : 'Failed to send custom notification'
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Log the notification attempt
    await logTeamsNotification(user.id, type, success, message)

    return NextResponse.json({
      success,
      message,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending Teams notification:', error)
    return NextResponse.json(
      { error: 'Failed to send Teams notification' },
      { status: 500 }
    )
  }
}

// GET /api/teams/webhook - Test Teams connection
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const result = await TeamsIntegrationService.testConnection()
    
    // Log the test attempt
    await logTeamsNotification(user.id, 'connection_test', result.success, result.message)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      configuration: TeamsIntegrationService.validateConfiguration()
    })

  } catch (error) {
    console.error('Error testing Teams connection:', error)
    return NextResponse.json(
      { error: 'Failed to test Teams connection' },
      { status: 500 }
    )
  }
}

async function logTeamsNotification(userId: string, type: string, success: boolean, message: string) {
  try {
    // Create a simple log entry - you might want to create a dedicated table for this
    await prisma.activityLog.create({
      data: {
        userId,
        action: `teams_${type}`,
        details: {
          type,
          success,
          message,
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Failed to log Teams notification:', error)
  }
}
