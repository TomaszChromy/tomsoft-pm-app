import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface ZapierConfig {
  webhookUrl?: string
  apiKey?: string
  subscribeKey?: string
}

export interface ZapierWebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
  meta?: {
    userId: string
    projectId?: string
    taskId?: string
  }
}

export interface ZapierTrigger {
  event: string
  name: string
  description: string
  sampleData: Record<string, any>
}

export interface ZapierAction {
  key: string
  name: string
  description: string
  operation: {
    inputFields: Array<{
      key: string
      label: string
      type: string
      required?: boolean
      helpText?: string
    }>
    perform: (data: Record<string, any>) => Promise<any>
  }
}

export class ZapierService {
  private config: ZapierConfig

  constructor(config: ZapierConfig) {
    this.config = config
  }

  // Webhook Management
  async sendWebhook(event: string, data: Record<string, any>, meta?: Record<string, any>): Promise<boolean> {
    if (!this.config.webhookUrl) {
      console.warn('No webhook URL configured for Zapier')
      return false
    }

    const payload: ZapierWebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      meta,
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TomSoft-PM/1.0',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        },
        body: JSON.stringify(payload),
      })

      // Log webhook attempt
      await this.logWebhook(
        'POST',
        this.config.webhookUrl,
        payload,
        response.status,
        await response.text(),
        Date.now() - Date.now() // This would be calculated properly
      )

      return response.ok
    } catch (error) {
      console.error('Failed to send Zapier webhook:', error)
      
      // Log failed webhook
      await this.logWebhook(
        'POST',
        this.config.webhookUrl,
        payload,
        null,
        null,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      return false
    }
  }

  // Event Triggers
  async triggerTaskCreated(task: any): Promise<void> {
    await this.sendWebhook('task.created', {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`,
        email: task.assignee.email,
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
      } : null,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
    }, {
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId: task.id,
    })
  }

  async triggerTaskUpdated(task: any, changes: Record<string, any>): Promise<void> {
    await this.sendWebhook('task.updated', {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`,
        email: task.assignee.email,
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
      } : null,
      dueDate: task.dueDate,
      updatedAt: task.updatedAt,
      changes,
    }, {
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId: task.id,
    })
  }

  async triggerTaskCompleted(task: any): Promise<void> {
    await this.sendWebhook('task.completed', {
      id: task.id,
      title: task.title,
      description: task.description,
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: `${task.assignee.firstName} ${task.assignee.lastName}`,
        email: task.assignee.email,
      } : null,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
      } : null,
      completedAt: new Date().toISOString(),
      duration: task.timeEntries?.reduce((total: number, entry: any) => total + parseFloat(entry.hours), 0) || 0,
    }, {
      userId: task.assigneeId,
      projectId: task.projectId,
      taskId: task.id,
    })
  }

  async triggerProjectCreated(project: any): Promise<void> {
    await this.sendWebhook('project.created', {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      owner: {
        id: project.owner.id,
        name: `${project.owner.firstName} ${project.owner.lastName}`,
        email: project.owner.email,
      },
      client: project.client ? {
        id: project.client.id,
        name: project.client.name,
        email: project.client.email,
      } : null,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
    }, {
      userId: project.ownerId,
      projectId: project.id,
    })
  }

  async triggerProjectStatusChanged(project: any, oldStatus: string): Promise<void> {
    await this.sendWebhook('project.status_changed', {
      id: project.id,
      name: project.name,
      oldStatus,
      newStatus: project.status,
      owner: {
        id: project.owner.id,
        name: `${project.owner.firstName} ${project.owner.lastName}`,
        email: project.owner.email,
      },
      updatedAt: project.updatedAt,
    }, {
      userId: project.ownerId,
      projectId: project.id,
    })
  }

  async triggerTimeEntryCreated(timeEntry: any): Promise<void> {
    await this.sendWebhook('time_entry.created', {
      id: timeEntry.id,
      description: timeEntry.description,
      hours: parseFloat(timeEntry.hours),
      date: timeEntry.date,
      user: {
        id: timeEntry.user.id,
        name: `${timeEntry.user.firstName} ${timeEntry.user.lastName}`,
        email: timeEntry.user.email,
      },
      task: timeEntry.task ? {
        id: timeEntry.task.id,
        title: timeEntry.task.title,
      } : null,
      project: timeEntry.project ? {
        id: timeEntry.project.id,
        name: timeEntry.project.name,
      } : null,
      billable: timeEntry.billable,
      hourlyRate: timeEntry.hourlyRate ? parseFloat(timeEntry.hourlyRate) : null,
      createdAt: timeEntry.createdAt,
    }, {
      userId: timeEntry.userId,
      projectId: timeEntry.projectId,
      taskId: timeEntry.taskId,
    })
  }

  // Zapier App Configuration
  static getTriggers(): ZapierTrigger[] {
    return [
      {
        event: 'task.created',
        name: 'New Task Created',
        description: 'Triggers when a new task is created in TomSoft PM',
        sampleData: {
          id: 'task_123',
          title: 'Sample Task',
          description: 'This is a sample task description',
          status: 'TODO',
          priority: 'MEDIUM',
          assignee: {
            id: 'user_456',
            name: 'John Doe',
            email: 'john@example.com',
          },
          project: {
            id: 'project_789',
            name: 'Sample Project',
          },
          dueDate: '2024-12-31T23:59:59Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      {
        event: 'task.completed',
        name: 'Task Completed',
        description: 'Triggers when a task is marked as completed',
        sampleData: {
          id: 'task_123',
          title: 'Sample Task',
          description: 'This is a sample task description',
          assignee: {
            id: 'user_456',
            name: 'John Doe',
            email: 'john@example.com',
          },
          project: {
            id: 'project_789',
            name: 'Sample Project',
          },
          completedAt: '2024-01-15T10:30:00Z',
          duration: 8.5,
        },
      },
      {
        event: 'project.created',
        name: 'New Project Created',
        description: 'Triggers when a new project is created',
        sampleData: {
          id: 'project_789',
          name: 'Sample Project',
          description: 'This is a sample project description',
          status: 'ACTIVE',
          priority: 'HIGH',
          owner: {
            id: 'user_456',
            name: 'John Doe',
            email: 'john@example.com',
          },
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      {
        event: 'time_entry.created',
        name: 'New Time Entry',
        description: 'Triggers when a new time entry is logged',
        sampleData: {
          id: 'time_entry_101',
          description: 'Working on feature implementation',
          hours: 4.5,
          date: '2024-01-15',
          user: {
            id: 'user_456',
            name: 'John Doe',
            email: 'john@example.com',
          },
          task: {
            id: 'task_123',
            title: 'Sample Task',
          },
          project: {
            id: 'project_789',
            name: 'Sample Project',
          },
          billable: true,
          hourlyRate: 75.00,
          createdAt: '2024-01-15T16:30:00Z',
        },
      },
    ]
  }

  static getActions(): ZapierAction[] {
    return [
      {
        key: 'create_task',
        name: 'Create Task',
        description: 'Creates a new task in TomSoft PM',
        operation: {
          inputFields: [
            {
              key: 'title',
              label: 'Task Title',
              type: 'string',
              required: true,
              helpText: 'The title of the task',
            },
            {
              key: 'description',
              label: 'Description',
              type: 'text',
              helpText: 'Optional description for the task',
            },
            {
              key: 'projectId',
              label: 'Project ID',
              type: 'string',
              required: true,
              helpText: 'The ID of the project this task belongs to',
            },
            {
              key: 'assigneeId',
              label: 'Assignee ID',
              type: 'string',
              helpText: 'The ID of the user to assign this task to',
            },
            {
              key: 'priority',
              label: 'Priority',
              type: 'string',
              helpText: 'Task priority: LOW, MEDIUM, HIGH, or URGENT',
            },
            {
              key: 'dueDate',
              label: 'Due Date',
              type: 'datetime',
              helpText: 'When the task is due (ISO 8601 format)',
            },
          ],
          perform: async (data: Record<string, any>) => {
            // This would be implemented in the actual Zapier action handler
            return {
              id: 'new_task_id',
              title: data.title,
              status: 'TODO',
              createdAt: new Date().toISOString(),
            }
          },
        },
      },
      {
        key: 'create_project',
        name: 'Create Project',
        description: 'Creates a new project in TomSoft PM',
        operation: {
          inputFields: [
            {
              key: 'name',
              label: 'Project Name',
              type: 'string',
              required: true,
              helpText: 'The name of the project',
            },
            {
              key: 'description',
              label: 'Description',
              type: 'text',
              helpText: 'Optional description for the project',
            },
            {
              key: 'ownerId',
              label: 'Owner ID',
              type: 'string',
              required: true,
              helpText: 'The ID of the user who will own this project',
            },
            {
              key: 'priority',
              label: 'Priority',
              type: 'string',
              helpText: 'Project priority: LOW, MEDIUM, HIGH, or URGENT',
            },
            {
              key: 'startDate',
              label: 'Start Date',
              type: 'date',
              helpText: 'When the project starts (YYYY-MM-DD format)',
            },
            {
              key: 'endDate',
              label: 'End Date',
              type: 'date',
              helpText: 'When the project ends (YYYY-MM-DD format)',
            },
          ],
          perform: async (data: Record<string, any>) => {
            // This would be implemented in the actual Zapier action handler
            return {
              id: 'new_project_id',
              name: data.name,
              status: 'PLANNING',
              createdAt: new Date().toISOString(),
            }
          },
        },
      },
    ]
  }

  // Utility methods
  private async logWebhook(
    method: string,
    url: string,
    payload: any,
    statusCode: number | null,
    responseBody: string | null,
    responseTime: number | null,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          method,
          url,
          headers: JSON.stringify({ 'Content-Type': 'application/json' }),
          payload: JSON.stringify(payload),
          statusCode,
          responseBody,
          responseTime,
          processed: statusCode ? statusCode >= 200 && statusCode < 300 : false,
          errorMessage,
        },
      })
    } catch (error) {
      console.error('Failed to log webhook:', error)
    }
  }

  static validateConfig(config: any): config is ZapierConfig {
    return config && (config.webhookUrl || config.apiKey)
  }

  static async testConnection(config: ZapierConfig): Promise<boolean> {
    if (!config.webhookUrl) return false

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        },
        body: JSON.stringify({
          event: 'test.connection',
          timestamp: new Date().toISOString(),
          data: { message: 'Test connection from TomSoft PM' },
        }),
      })

      return response.ok
    } catch {
      return false
    }
  }

  // Generate webhook signature for security
  static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}
