import webpush from 'web-push'

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushMessage {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: PushAction[]
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

export interface PushAction {
  action: string
  title: string
  icon?: string
}

export class PushService {
  constructor() {
    // Configure web-push with VAPID keys
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@tomsoft.pl'

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    }
  }

  async sendPushNotification(subscription: PushSubscription, message: PushMessage): Promise<boolean> {
    try {
      const payload = JSON.stringify(message)
      
      await webpush.sendNotification(subscription, payload)
      return true
    } catch (error) {
      console.error('Push notification failed:', error)
      return false
    }
  }

  async sendBatchPushNotifications(
    subscriptions: PushSubscription[], 
    message: PushMessage
  ): Promise<{ success: number; failed: number; results: boolean[] }> {
    const results: boolean[] = []
    let success = 0
    let failed = 0

    for (const subscription of subscriptions) {
      const result = await this.sendPushNotification(subscription, message)
      results.push(result)
      
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed, results }
  }

  // Predefined push notification templates
  static getTaskAssignedPush(data: {
    userName: string
    taskTitle: string
    projectName: string
    assignedBy: string
    taskUrl: string
  }): PushMessage {
    return {
      title: '📋 Nowe zadanie przypisane',
      body: `${data.taskTitle} w projekcie ${data.projectName}`,
      icon: '/icons/task-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'TASK_ASSIGNED',
        taskId: data.taskUrl.split('/').pop(),
        url: data.taskUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz zadanie',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Odrzuć'
        }
      ],
      tag: 'task-assigned',
      requireInteraction: true
    }
  }

  static getTaskCompletedPush(data: {
    taskTitle: string
    projectName: string
    completedBy: string
    taskUrl: string
  }): PushMessage {
    return {
      title: '✅ Zadanie ukończone',
      body: `${data.taskTitle} w projekcie ${data.projectName} zostało ukończone przez ${data.completedBy}`,
      icon: '/icons/success-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'TASK_COMPLETED',
        taskId: data.taskUrl.split('/').pop(),
        url: data.taskUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz zadanie'
        }
      ],
      tag: 'task-completed'
    }
  }

  static getProjectUpdatePush(data: {
    projectName: string
    updateType: string
    updateDescription: string
    updatedBy: string
    projectUrl: string
  }): PushMessage {
    return {
      title: '🔄 Aktualizacja projektu',
      body: `${data.projectName}: ${data.updateDescription}`,
      icon: '/icons/project-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'PROJECT_UPDATE',
        projectId: data.projectUrl.split('/').pop(),
        url: data.projectUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz projekt'
        }
      ],
      tag: 'project-update'
    }
  }

  static getDeadlineReminderPush(data: {
    taskTitle: string
    projectName: string
    deadline: string
    daysLeft: number
    taskUrl: string
  }): PushMessage {
    const urgencyEmoji = data.daysLeft <= 1 ? '🚨' : data.daysLeft <= 3 ? '⚠️' : '📅'
    const isUrgent = data.daysLeft <= 1
    
    return {
      title: `${urgencyEmoji} Przypomnienie o terminie`,
      body: `${data.taskTitle} kończy się za ${data.daysLeft} dni`,
      icon: isUrgent ? '/icons/urgent-icon.png' : '/icons/reminder-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'DEADLINE_REMINDER',
        taskId: data.taskUrl.split('/').pop(),
        url: data.taskUrl,
        daysLeft: data.daysLeft
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz zadanie'
        },
        {
          action: 'snooze',
          title: 'Przypomnij później'
        }
      ],
      tag: 'deadline-reminder',
      requireInteraction: isUrgent
    }
  }

  static getSprintStartPush(data: {
    sprintName: string
    projectName: string
    startDate: string
    endDate: string
    sprintUrl: string
  }): PushMessage {
    return {
      title: '🚀 Nowy sprint rozpoczęty',
      body: `${data.sprintName} w projekcie ${data.projectName}`,
      icon: '/icons/sprint-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'SPRINT_START',
        sprintId: data.sprintUrl.split('/').pop(),
        url: data.sprintUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz sprint'
        }
      ],
      tag: 'sprint-start'
    }
  }

  static getSprintCompletedPush(data: {
    sprintName: string
    projectName: string
    completedStoryPoints: number
    totalStoryPoints: number
    sprintUrl: string
  }): PushMessage {
    const completionRate = Math.round((data.completedStoryPoints / data.totalStoryPoints) * 100)
    
    return {
      title: '🏁 Sprint ukończony',
      body: `${data.sprintName}: ${completionRate}% ukończenia`,
      icon: '/icons/sprint-complete-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'SPRINT_COMPLETED',
        sprintId: data.sprintUrl.split('/').pop(),
        url: data.sprintUrl,
        completionRate
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz wyniki'
        }
      ],
      tag: 'sprint-completed'
    }
  }

  static getCommentAddedPush(data: {
    taskTitle: string
    projectName: string
    commentAuthor: string
    commentPreview: string
    taskUrl: string
  }): PushMessage {
    return {
      title: '💬 Nowy komentarz',
      body: `${data.commentAuthor} skomentował ${data.taskTitle}: ${data.commentPreview}`,
      icon: '/icons/comment-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'COMMENT_ADDED',
        taskId: data.taskUrl.split('/').pop(),
        url: data.taskUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz komentarz'
        },
        {
          action: 'reply',
          title: 'Odpowiedz'
        }
      ],
      tag: 'comment-added'
    }
  }

  static getMentionPush(data: {
    mentionedBy: string
    context: string
    contextUrl: string
  }): PushMessage {
    return {
      title: '👤 Zostałeś oznaczony',
      body: `${data.mentionedBy} oznaczył Cię w: ${data.context}`,
      icon: '/icons/mention-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'MENTION',
        url: data.contextUrl
      },
      actions: [
        {
          action: 'view',
          title: 'Zobacz'
        }
      ],
      tag: 'mention',
      requireInteraction: true
    }
  }

  static getSystemAlertPush(data: {
    alertType: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }): PushMessage {
    const severityEmojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥'
    }
    
    return {
      title: `${severityEmojis[data.severity]} Alert systemowy`,
      body: `${data.alertType}: ${data.message}`,
      icon: '/icons/alert-icon.png',
      badge: '/icons/badge.png',
      data: {
        type: 'SYSTEM_ALERT',
        severity: data.severity
      },
      tag: 'system-alert',
      requireInteraction: data.severity === 'high' || data.severity === 'critical'
    }
  }

  // Utility methods
  static generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    return webpush.generateVAPIDKeys()
  }

  static validateSubscription(subscription: any): boolean {
    return (
      subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string'
    )
  }

  static getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied')
    }
    
    return Notification.requestPermission()
  }

  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }
}
