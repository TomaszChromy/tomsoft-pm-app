import axios from 'axios'

// Types for Teams integration
export interface TeamsWebhookPayload {
  type: string
  title: string
  text: string
  themeColor: string
  sections?: TeamsSection[]
  potentialAction?: TeamsAction[]
}

export interface TeamsSection {
  activityTitle?: string
  activitySubtitle?: string
  activityImage?: string
  facts?: TeamsFact[]
  markdown?: boolean
}

export interface TeamsFact {
  name: string
  value: string
}

export interface TeamsAction {
  '@type': string
  name: string
  targets: TeamsTarget[]
}

export interface TeamsTarget {
  os: string
  uri: string
}

export interface TeamsNotificationConfig {
  webhookUrl: string
  enabled: boolean
  events: string[]
}

export interface ProjectNotification {
  projectId: string
  projectName: string
  event: 'created' | 'updated' | 'completed' | 'delayed' | 'budget_exceeded'
  message: string
  details?: any
  assignee?: {
    id: string
    name: string
    email: string
  }
}

export interface TaskNotification {
  taskId: string
  taskTitle: string
  projectName: string
  event: 'created' | 'assigned' | 'completed' | 'overdue' | 'updated'
  message: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  dueDate?: Date
}

export class TeamsIntegrationService {
  private static webhookUrl = process.env.TEAMS_WEBHOOK_URL || ''
  private static botToken = process.env.TEAMS_BOT_TOKEN || ''
  private static tenantId = process.env.TEAMS_TENANT_ID || ''
  private static clientId = process.env.TEAMS_CLIENT_ID || ''
  private static clientSecret = process.env.TEAMS_CLIENT_SECRET || ''

  /**
   * Send a notification to Microsoft Teams channel
   */
  static async sendNotification(payload: TeamsWebhookPayload): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.warn('Teams webhook URL not configured')
        return false
      }

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return response.status === 200
    } catch (error) {
      console.error('Failed to send Teams notification:', error)
      return false
    }
  }

  /**
   * Send project notification to Teams
   */
  static async sendProjectNotification(notification: ProjectNotification): Promise<boolean> {
    const color = this.getEventColor(notification.event)
    
    const payload: TeamsWebhookPayload = {
      type: 'MessageCard',
      title: `Project ${notification.event.replace('_', ' ').toUpperCase()}`,
      text: notification.message,
      themeColor: color,
      sections: [
        {
          activityTitle: notification.projectName,
          activitySubtitle: `Project ID: ${notification.projectId}`,
          facts: [
            { name: 'Event', value: notification.event },
            { name: 'Project', value: notification.projectName },
            { name: 'Time', value: new Date().toLocaleString() }
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Project',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/projects/${notification.projectId}`
            }
          ]
        }
      ]
    }

    if (notification.assignee) {
      payload.sections![0].facts!.push({
        name: 'Assignee',
        value: notification.assignee.name
      })
    }

    return this.sendNotification(payload)
  }

  /**
   * Send task notification to Teams
   */
  static async sendTaskNotification(notification: TaskNotification): Promise<boolean> {
    const color = this.getEventColor(notification.event)
    
    const payload: TeamsWebhookPayload = {
      type: 'MessageCard',
      title: `Task ${notification.event.toUpperCase()}`,
      text: notification.message,
      themeColor: color,
      sections: [
        {
          activityTitle: notification.taskTitle,
          activitySubtitle: `Project: ${notification.projectName}`,
          facts: [
            { name: 'Event', value: notification.event },
            { name: 'Task', value: notification.taskTitle },
            { name: 'Project', value: notification.projectName },
            { name: 'Time', value: new Date().toLocaleString() }
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Task',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/tasks/${notification.taskId}`
            }
          ]
        }
      ]
    }

    if (notification.assignee) {
      payload.sections![0].facts!.push({
        name: 'Assignee',
        value: notification.assignee.name
      })
    }

    if (notification.dueDate) {
      payload.sections![0].facts!.push({
        name: 'Due Date',
        value: notification.dueDate.toLocaleDateString()
      })
    }

    return this.sendNotification(payload)
  }

  /**
   * Send daily summary to Teams
   */
  static async sendDailySummary(summary: any): Promise<boolean> {
    const payload: TeamsWebhookPayload = {
      type: 'MessageCard',
      title: '📊 Daily Project Summary',
      text: 'Here\'s your daily project management summary',
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: 'Today\'s Metrics',
          facts: [
            { name: 'Tasks Completed', value: summary.tasksCompleted.toString() },
            { name: 'New Tasks Created', value: summary.newTasks.toString() },
            { name: 'Projects Updated', value: summary.projectsUpdated.toString() },
            { name: 'Team Members Active', value: summary.activeMembers.toString() },
            { name: 'Hours Logged', value: `${summary.hoursLogged}h` }
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Dashboard',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/dashboard`
            }
          ]
        }
      ]
    }

    return this.sendNotification(payload)
  }

  /**
   * Send budget alert to Teams
   */
  static async sendBudgetAlert(projectId: string, projectName: string, budgetData: any): Promise<boolean> {
    const payload: TeamsWebhookPayload = {
      type: 'MessageCard',
      title: '⚠️ Budget Alert',
      text: `Project "${projectName}" has exceeded its budget threshold`,
      themeColor: 'FF0000',
      sections: [
        {
          activityTitle: 'Budget Status',
          activitySubtitle: projectName,
          facts: [
            { name: 'Allocated Budget', value: `$${budgetData.allocated}` },
            { name: 'Spent Amount', value: `$${budgetData.spent}` },
            { name: 'Remaining', value: `$${budgetData.remaining}` },
            { name: 'Utilization', value: `${budgetData.utilization}%` },
            { name: 'Status', value: budgetData.status }
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Review Budget',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/projects/${projectId}/budget`
            }
          ]
        }
      ]
    }

    return this.sendNotification(payload)
  }

  /**
   * Create Teams meeting for project discussion
   */
  static async createProjectMeeting(projectId: string, projectName: string, participants: string[]): Promise<any> {
    try {
      // This would require Microsoft Graph API integration
      // For now, return a mock response
      console.log(`Creating Teams meeting for project: ${projectName}`)
      console.log(`Participants: ${participants.join(', ')}`)
      
      return {
        success: true,
        meetingId: `meeting_${Date.now()}`,
        joinUrl: `https://teams.microsoft.com/l/meetup-join/mock_meeting_url`,
        message: 'Meeting created successfully'
      }
    } catch (error) {
      console.error('Failed to create Teams meeting:', error)
      return {
        success: false,
        error: 'Failed to create meeting'
      }
    }
  }

  /**
   * Sync calendar events with Teams
   */
  static async syncCalendarEvents(events: any[]): Promise<boolean> {
    try {
      // This would integrate with Microsoft Graph API
      console.log(`Syncing ${events.length} calendar events with Teams`)
      return true
    } catch (error) {
      console.error('Failed to sync calendar events:', error)
      return false
    }
  }

  /**
   * Get Teams presence status for team members
   */
  static async getTeamPresence(userIds: string[]): Promise<any> {
    try {
      // This would use Microsoft Graph API to get presence
      const mockPresence = userIds.map(userId => ({
        userId,
        availability: Math.random() > 0.5 ? 'Available' : 'Busy',
        activity: Math.random() > 0.7 ? 'In a meeting' : 'Available'
      }))
      
      return mockPresence
    } catch (error) {
      console.error('Failed to get Teams presence:', error)
      return []
    }
  }

  /**
   * Send adaptive card to Teams
   */
  static async sendAdaptiveCard(card: any): Promise<boolean> {
    try {
      const payload = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: card
          }
        ]
      }

      // This would send to Teams via Bot Framework
      console.log('Sending adaptive card to Teams:', JSON.stringify(payload, null, 2))
      return true
    } catch (error) {
      console.error('Failed to send adaptive card:', error)
      return false
    }
  }

  /**
   * Get event color based on event type
   */
  private static getEventColor(event: string): string {
    const colors: { [key: string]: string } = {
      'created': '0078D4',      // Blue
      'updated': 'FFA500',      // Orange
      'completed': '00FF00',    // Green
      'assigned': '9932CC',     // Purple
      'overdue': 'FF0000',      // Red
      'delayed': 'FF4500',      // Orange Red
      'budget_exceeded': 'DC143C' // Crimson
    }
    
    return colors[event] || '808080' // Default gray
  }

  /**
   * Validate Teams webhook configuration
   */
  static validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!this.webhookUrl) {
      errors.push('Teams webhook URL not configured')
    }
    
    if (!process.env.FRONTEND_URL) {
      errors.push('Frontend URL not configured')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Test Teams connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPayload: TeamsWebhookPayload = {
        type: 'MessageCard',
        title: '🧪 TomSoft PM - Connection Test',
        text: 'This is a test message to verify Teams integration is working correctly.',
        themeColor: '0078D4'
      }

      const success = await this.sendNotification(testPayload)
      
      return {
        success,
        message: success 
          ? 'Teams integration is working correctly!' 
          : 'Failed to send test message to Teams'
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
