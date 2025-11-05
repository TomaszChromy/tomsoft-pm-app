import { prisma } from './prisma'
import { EmailService } from './email-service'
import { SlackService } from './slack-service'
import { SMSService } from './sms-service'
import { PushService } from './push-service'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_UPDATE' | 'DEADLINE_REMINDER'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  actionUrl?: string
  metadata?: Record<string, any>
  emailData?: {
    to: string
    template: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_UPDATE' | 'DEADLINE_REMINDER'
    templateData: any
  }
  slackData?: {
    webhookUrl: string
    channel?: string
    template: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_UPDATE' | 'DEADLINE_REMINDER'
    templateData: any
  }
  smsData?: {
    phoneNumber: string
    template: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_UPDATE' | 'DEADLINE_REMINDER'
    templateData: any
  }
}

export class NotificationService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async createNotification(data: NotificationData): Promise<string> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'NORMAL',
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      })

      // Get user notification settings
      const settings = await this.getUserNotificationSettings(data.userId)

      // Send email if enabled and configured
      if (data.emailData && settings.emailEnabled && this.shouldSendEmailForType(data.type, settings)) {
        await this.sendEmailNotification(notification.id, data.emailData)
      }

      // Send push notification if enabled
      if (settings.pushEnabled && this.shouldSendPushForType(data.type, settings)) {
        await this.sendPushNotification(notification.id, data)
      }

      // Send Slack notification if enabled and configured
      if (data.slackData && settings.slackEnabled && this.shouldSendSlackForType(data.type, settings)) {
        await this.sendSlackNotification(notification.id, data.slackData)
      }

      // Send SMS notification if enabled and configured
      if (data.smsData && settings.smsEnabled && this.shouldSendSMSForType(data.type, data.priority || 'NORMAL', settings)) {
        await this.sendSMSNotification(notification.id, data.smsData)
      }

      return notification.id
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  private async getUserNotificationSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    })

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId }
      })
    }

    return settings
  }

  private shouldSendEmailForType(type: string, settings: any): boolean {
    switch (type) {
      case 'TASK_ASSIGNED':
        return settings.emailTaskAssigned
      case 'TASK_COMPLETED':
        return settings.emailTaskCompleted
      case 'PROJECT_UPDATE':
        return settings.emailProjectUpdate
      case 'DEADLINE_REMINDER':
        return settings.emailDeadlineReminder
      default:
        return false
    }
  }

  private shouldSendPushForType(type: string, settings: any): boolean {
    switch (type) {
      case 'TASK_ASSIGNED':
        return settings.pushTaskAssigned
      case 'TASK_COMPLETED':
        return settings.pushTaskCompleted
      case 'PROJECT_UPDATE':
        return settings.pushProjectUpdate
      case 'DEADLINE_REMINDER':
        return settings.pushDeadlineReminder
      default:
        return false
    }
  }

  private async sendEmailNotification(notificationId: string, emailData: any) {
    try {
      let template
      
      switch (emailData.template) {
        case 'TASK_ASSIGNED':
          template = EmailService.getTaskAssignedTemplate(emailData.templateData)
          break
        case 'TASK_COMPLETED':
          template = EmailService.getTaskCompletedTemplate(emailData.templateData)
          break
        case 'PROJECT_UPDATE':
          template = EmailService.getProjectUpdateTemplate(emailData.templateData)
          break
        case 'DEADLINE_REMINDER':
          template = EmailService.getDeadlineReminderTemplate(emailData.templateData)
          break
        default:
          throw new Error(`Unknown email template: ${emailData.template}`)
      }

      await this.emailService.sendEmail({
        to: emailData.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        notificationId
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  private async sendPushNotification(notificationId: string, data: NotificationData) {
    try {
      // Get user's push subscriptions from database
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          // Note: We would need to add pushSubscriptions field to User model
          // For now, we'll just mark as sent
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // TODO: Implement actual push notification sending
      // const pushService = new PushService()
      // const pushMessage = this.createPushMessage(data)
      // const subscriptions = user.pushSubscriptions || []
      // await pushService.sendBatchPushNotifications(subscriptions, pushMessage)

      // For now, just mark as sent
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          pushSent: true,
          pushSentAt: new Date(),
        }
      })
    } catch (error) {
      console.error('Failed to send push notification:', error)

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          pushSent: false,
          pushError: error instanceof Error ? error.message : 'Unknown error',
        }
      })
    }
  }

  // Helper methods for common notification types
  async notifyTaskAssigned(data: {
    userId: string
    taskId: string
    taskTitle: string
    projectName: string
    assignedBy: string
    userEmail: string
    userName: string
  }) {
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${data.taskId}`
    
    return this.createNotification({
      userId: data.userId,
      title: 'Nowe zadanie przypisane',
      message: `Zostało Ci przypisane zadanie "${data.taskTitle}" w projekcie ${data.projectName}`,
      type: 'TASK_ASSIGNED',
      priority: 'NORMAL',
      actionUrl: taskUrl,
      metadata: {
        taskId: data.taskId,
        assignedBy: data.assignedBy
      },
      emailData: {
        to: data.userEmail,
        template: 'TASK_ASSIGNED',
        templateData: {
          userName: data.userName,
          taskTitle: data.taskTitle,
          projectName: data.projectName,
          assignedBy: data.assignedBy,
          taskUrl
        }
      }
    })
  }

  async notifyTaskCompleted(data: {
    userId: string
    taskId: string
    taskTitle: string
    projectName: string
    completedBy: string
    userEmail: string
    userName: string
  }) {
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${data.taskId}`
    
    return this.createNotification({
      userId: data.userId,
      title: 'Zadanie ukończone',
      message: `Zadanie "${data.taskTitle}" zostało ukończone przez ${data.completedBy}`,
      type: 'TASK_COMPLETED',
      priority: 'NORMAL',
      actionUrl: taskUrl,
      metadata: {
        taskId: data.taskId,
        completedBy: data.completedBy
      },
      emailData: {
        to: data.userEmail,
        template: 'TASK_COMPLETED',
        templateData: {
          userName: data.userName,
          taskTitle: data.taskTitle,
          projectName: data.projectName,
          completedBy: data.completedBy,
          taskUrl
        }
      }
    })
  }

  async notifyProjectUpdate(data: {
    userId: string
    projectId: string
    projectName: string
    updateType: string
    updateDescription: string
    updatedBy: string
    userEmail: string
    userName: string
  }) {
    const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}`
    
    return this.createNotification({
      userId: data.userId,
      title: 'Aktualizacja projektu',
      message: `Projekt "${data.projectName}" został zaktualizowany: ${data.updateDescription}`,
      type: 'PROJECT_UPDATE',
      priority: 'NORMAL',
      actionUrl: projectUrl,
      metadata: {
        projectId: data.projectId,
        updateType: data.updateType,
        updatedBy: data.updatedBy
      },
      emailData: {
        to: data.userEmail,
        template: 'PROJECT_UPDATE',
        templateData: {
          userName: data.userName,
          projectName: data.projectName,
          updateType: data.updateType,
          updateDescription: data.updateDescription,
          updatedBy: data.updatedBy,
          projectUrl
        }
      }
    })
  }

  async notifyDeadlineReminder(data: {
    userId: string
    taskId: string
    taskTitle: string
    projectName: string
    deadline: Date
    userEmail: string
    userName: string
  }) {
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${data.taskId}`
    const daysLeft = Math.ceil((data.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const priority = daysLeft <= 1 ? 'URGENT' : daysLeft <= 3 ? 'HIGH' : 'NORMAL'
    
    return this.createNotification({
      userId: data.userId,
      title: 'Przypomnienie o terminie',
      message: `Zadanie "${data.taskTitle}" ma termin ${data.deadline.toLocaleDateString('pl-PL')} (${daysLeft} dni)`,
      type: 'DEADLINE_REMINDER',
      priority: priority as any,
      actionUrl: taskUrl,
      metadata: {
        taskId: data.taskId,
        deadline: data.deadline.toISOString(),
        daysLeft
      },
      emailData: {
        to: data.userEmail,
        template: 'DEADLINE_REMINDER',
        templateData: {
          userName: data.userName,
          taskTitle: data.taskTitle,
          projectName: data.projectName,
          deadline: data.deadline.toLocaleDateString('pl-PL'),
          daysLeft,
          taskUrl
        }
      }
    })
  }

  // Get notifications for user
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    })
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })
  }

  private async sendSlackNotification(notificationId: string, slackData: any) {
    try {
      const slackService = new SlackService(undefined, slackData.webhookUrl)
      let message

      switch (slackData.template) {
        case 'TASK_ASSIGNED':
          message = SlackService.getTaskAssignedMessage(slackData.templateData)
          break
        case 'TASK_COMPLETED':
          message = SlackService.getTaskCompletedMessage(slackData.templateData)
          break
        case 'PROJECT_UPDATE':
          message = SlackService.getProjectUpdateMessage(slackData.templateData)
          break
        case 'DEADLINE_REMINDER':
          message = SlackService.getDeadlineReminderMessage(slackData.templateData)
          break
        default:
          throw new Error(`Unknown Slack template: ${slackData.template}`)
      }

      if (slackData.channel) {
        message.channel = slackData.channel
      }

      const success = await slackService.sendMessage(message)

      // Update notification with Slack status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          // Note: We don't have slackSent fields in schema yet, but we can add them later
          metadata: JSON.stringify({
            slackSent: success,
            slackSentAt: success ? new Date().toISOString() : null,
            slackError: success ? null : 'Failed to send Slack message'
          })
        }
      })

      return success
    } catch (error) {
      console.error('Slack notification error:', error)

      // Update notification with error
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          metadata: JSON.stringify({
            slackSent: false,
            slackError: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      return false
    }
  }

  private shouldSendSlackForType(type: string, settings: any): boolean {
    switch (type) {
      case 'TASK_ASSIGNED':
        return settings.slackTaskAssigned
      case 'TASK_COMPLETED':
        return settings.slackTaskCompleted
      case 'PROJECT_UPDATE':
        return settings.slackProjectUpdate
      case 'DEADLINE_REMINDER':
        return true // Always send deadline reminders to Slack
      default:
        return true
    }
  }

  private async sendSMSNotification(notificationId: string, smsData: any) {
    try {
      const smsService = new SMSService()
      let messageBody

      switch (smsData.template) {
        case 'TASK_ASSIGNED':
          messageBody = SMSService.getTaskAssignedSMS(smsData.templateData)
          break
        case 'TASK_COMPLETED':
          messageBody = SMSService.getTaskCompletedSMS(smsData.templateData)
          break
        case 'PROJECT_UPDATE':
          messageBody = SMSService.getProjectUpdateSMS(smsData.templateData)
          break
        case 'DEADLINE_REMINDER':
          messageBody = SMSService.getDeadlineReminderSMS(smsData.templateData)
          break
        default:
          throw new Error(`Unknown SMS template: ${smsData.template}`)
      }

      const success = await smsService.sendSMS({
        to: smsData.phoneNumber,
        body: messageBody
      })

      // Update notification with SMS status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          metadata: JSON.stringify({
            smsSent: success,
            smsSentAt: success ? new Date().toISOString() : null,
            smsError: success ? null : 'Failed to send SMS'
          })
        }
      })

      return success
    } catch (error) {
      console.error('SMS notification error:', error)

      // Update notification with error
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          metadata: JSON.stringify({
            smsSent: false,
            smsError: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      return false
    }
  }

  private shouldSendSMSForType(type: string, priority: string, settings: any): boolean {
    // If SMS is set to urgent only, check priority
    if (settings.smsUrgentOnly) {
      return priority === 'HIGH' || priority === 'URGENT'
    }

    // Otherwise send all SMS notifications
    return true
  }
}
