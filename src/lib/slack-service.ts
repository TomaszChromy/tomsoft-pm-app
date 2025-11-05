import { WebClient } from '@slack/web-api'

export interface SlackMessage {
  text: string
  channel?: string
  username?: string
  icon_emoji?: string
  attachments?: SlackAttachment[]
  blocks?: any[]
}

export interface SlackAttachment {
  color?: string
  title?: string
  title_link?: string
  text?: string
  fields?: SlackField[]
  footer?: string
  ts?: number
}

export interface SlackField {
  title: string
  value: string
  short?: boolean
}

export class SlackService {
  private client: WebClient | null = null
  private webhookUrl: string | null = null

  constructor(token?: string, webhookUrl?: string) {
    if (token) {
      this.client = new WebClient(token)
    }
    this.webhookUrl = webhookUrl || null
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    try {
      if (this.client) {
        // Use Slack Web API
        await this.client.chat.postMessage({
          channel: message.channel || '#general',
          text: message.text,
          username: message.username || 'TomSoft PM',
          icon_emoji: message.icon_emoji || ':robot_face:',
          attachments: message.attachments,
          blocks: message.blocks,
        })
      } else if (this.webhookUrl) {
        // Use Webhook
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })

        if (!response.ok) {
          throw new Error(`Slack webhook failed: ${response.status}`)
        }
      } else {
        throw new Error('No Slack client or webhook URL configured')
      }

      return true
    } catch (error) {
      console.error('Slack message sending failed:', error)
      return false
    }
  }

  // Predefined message templates
  static getTaskAssignedMessage(data: {
    userName: string
    taskTitle: string
    projectName: string
    assignedBy: string
    taskUrl: string
  }): SlackMessage {
    return {
      text: `📋 Nowe zadanie przypisane`,
      attachments: [
        {
          color: '#2563EB',
          title: data.taskTitle,
          title_link: data.taskUrl,
          fields: [
            {
              title: 'Projekt',
              value: data.projectName,
              short: true
            },
            {
              title: 'Przypisane do',
              value: data.userName,
              short: true
            },
            {
              title: 'Przypisane przez',
              value: data.assignedBy,
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getTaskCompletedMessage(data: {
    taskTitle: string
    projectName: string
    completedBy: string
    taskUrl: string
  }): SlackMessage {
    return {
      text: `✅ Zadanie ukończone`,
      attachments: [
        {
          color: '#16A34A',
          title: data.taskTitle,
          title_link: data.taskUrl,
          fields: [
            {
              title: 'Projekt',
              value: data.projectName,
              short: true
            },
            {
              title: 'Ukończone przez',
              value: data.completedBy,
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getProjectUpdateMessage(data: {
    projectName: string
    updateType: string
    updateDescription: string
    updatedBy: string
    projectUrl: string
  }): SlackMessage {
    return {
      text: `🔄 Aktualizacja projektu`,
      attachments: [
        {
          color: '#7C3AED',
          title: data.projectName,
          title_link: data.projectUrl,
          text: data.updateDescription,
          fields: [
            {
              title: 'Typ aktualizacji',
              value: data.updateType,
              short: true
            },
            {
              title: 'Zaktualizowane przez',
              value: data.updatedBy,
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getDeadlineReminderMessage(data: {
    taskTitle: string
    projectName: string
    deadline: string
    daysLeft: number
    taskUrl: string
  }): SlackMessage {
    const urgencyColor = data.daysLeft <= 1 ? '#DC2626' : data.daysLeft <= 3 ? '#F59E0B' : '#2563EB'
    const urgencyEmoji = data.daysLeft <= 1 ? '🚨' : data.daysLeft <= 3 ? '⚠️' : '📅'
    
    return {
      text: `${urgencyEmoji} Przypomnienie o terminie`,
      attachments: [
        {
          color: urgencyColor,
          title: data.taskTitle,
          title_link: data.taskUrl,
          fields: [
            {
              title: 'Projekt',
              value: data.projectName,
              short: true
            },
            {
              title: 'Termin',
              value: data.deadline,
              short: true
            },
            {
              title: 'Pozostało dni',
              value: data.daysLeft.toString(),
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getSprintStartMessage(data: {
    sprintName: string
    projectName: string
    startDate: string
    endDate: string
    totalStoryPoints: number
    sprintUrl: string
  }): SlackMessage {
    return {
      text: `🚀 Nowy sprint rozpoczęty`,
      attachments: [
        {
          color: '#10B981',
          title: data.sprintName,
          title_link: data.sprintUrl,
          fields: [
            {
              title: 'Projekt',
              value: data.projectName,
              short: true
            },
            {
              title: 'Data rozpoczęcia',
              value: data.startDate,
              short: true
            },
            {
              title: 'Data zakończenia',
              value: data.endDate,
              short: true
            },
            {
              title: 'Story Points',
              value: data.totalStoryPoints.toString(),
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getSprintCompletedMessage(data: {
    sprintName: string
    projectName: string
    completedStoryPoints: number
    totalStoryPoints: number
    sprintUrl: string
  }): SlackMessage {
    const completionRate = Math.round((data.completedStoryPoints / data.totalStoryPoints) * 100)
    
    return {
      text: `🏁 Sprint ukończony`,
      attachments: [
        {
          color: completionRate >= 90 ? '#16A34A' : completionRate >= 70 ? '#F59E0B' : '#DC2626',
          title: data.sprintName,
          title_link: data.sprintUrl,
          fields: [
            {
              title: 'Projekt',
              value: data.projectName,
              short: true
            },
            {
              title: 'Ukończone Story Points',
              value: `${data.completedStoryPoints}/${data.totalStoryPoints}`,
              short: true
            },
            {
              title: 'Procent ukończenia',
              value: `${completionRate}%`,
              short: true
            }
          ],
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }

  static getDailyStandupReminderMessage(data: {
    teamMembers: string[]
    projectName: string
    meetingUrl?: string
  }): SlackMessage {
    const membersList = data.teamMembers.map(member => `• ${member}`).join('\n')
    
    return {
      text: `🗣️ Przypomnienie o Daily Standup`,
      attachments: [
        {
          color: '#6366F1',
          title: `Daily Standup - ${data.projectName}`,
          title_link: data.meetingUrl,
          text: `Czas na daily standup!\n\nUczestnicy:\n${membersList}`,
          footer: 'TomSoft PM',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }
  }
}
