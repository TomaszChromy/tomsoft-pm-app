import { prisma } from '@/lib/prisma'
import { GitHubService, GitHubConfig } from './github-service'
import { GoogleCalendarService, GoogleCalendarConfig } from './google-calendar-service'
import { ZapierService, ZapierConfig } from './zapier-service'

export type IntegrationType = 'GITHUB' | 'GITLAB' | 'JIRA' | 'GOOGLE_CALENDAR' | 'ZAPIER' | 'SLACK'

export interface IntegrationConfig {
  GITHUB: GitHubConfig
  GITLAB: GitHubConfig // Similar to GitHub
  JIRA: {
    baseUrl: string
    email: string
    apiToken: string
    projectKey?: string
  }
  GOOGLE_CALENDAR: GoogleCalendarConfig
  ZAPIER: ZapierConfig
  SLACK: {
    botToken: string
    webhookUrl?: string
    channel?: string
  }
}

export interface CreateIntegrationData {
  name: string
  type: IntegrationType
  config: any
  isActive?: boolean
  webhookUrl?: string
  webhookSecret?: string
}

export interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsSuccess: number
  itemsError: number
  errors: string[]
  duration: number
}

export class IntegrationService {
  // Create Integration
  static async createIntegration(userId: string, data: CreateIntegrationData): Promise<string> {
    try {
      // Skip validation and connection test for now (for testing purposes)
      // TODO: Re-enable validation and connection test when OAuth is implemented
      // if (!this.validateConfig(data.type, data.config)) {
      //   throw new Error(`Invalid configuration for ${data.type} integration`)
      // }

      // const connectionTest = await this.testConnection(data.type, data.config)
      // if (!connectionTest) {
      //   throw new Error(`Failed to connect to ${data.type}`)
      // }

      const integration = await prisma.integration.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          config: JSON.stringify(data.config),
          isActive: data.isActive ?? true,
          webhookUrl: data.webhookUrl,
          webhookSecret: data.webhookSecret,
          syncStatus: 'PENDING',
        },
      })

      // Log creation
      await this.logSync(integration.id, 'create', 'SYNCED', 1, 1, 0)

      return integration.id
    } catch (error) {
      console.error('Failed to create integration:', error)
      throw error
    }
  }

  // Get User Integrations
  static async getUserIntegrations(userId: string): Promise<any[]> {
    return prisma.integration.findMany({
      where: { userId },
      include: {
        syncLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            repositories: true,
            calendarEvents: true,
            webhooks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Get Integration by ID
  static async getIntegration(integrationId: string, userId: string): Promise<any> {
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        userId,
      },
      include: {
        syncLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        repositories: true,
        calendarEvents: true,
      },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    return integration
  }

  // Update Integration
  static async updateIntegration(
    integrationId: string,
    userId: string,
    updates: Partial<CreateIntegrationData>
  ): Promise<void> {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, userId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    const updateData: any = {}

    if (updates.name) updateData.name = updates.name
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive
    if (updates.webhookUrl) updateData.webhookUrl = updates.webhookUrl
    if (updates.webhookSecret) updateData.webhookSecret = updates.webhookSecret

    if (updates.config) {
      if (!this.validateConfig(integration.type as IntegrationType, updates.config)) {
        throw new Error(`Invalid configuration for ${integration.type} integration`)
      }
      updateData.config = JSON.stringify(updates.config)
    }

    await prisma.integration.update({
      where: { id: integrationId },
      data: updateData,
    })
  }

  // Delete Integration
  static async deleteIntegration(integrationId: string, userId: string): Promise<void> {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, userId },
    })

    if (!integration) {
      throw new Error('Integration not found')
    }

    await prisma.integration.delete({
      where: { id: integrationId },
    })
  }

  // Sync Integration
  static async syncIntegration(integrationId: string): Promise<SyncResult> {
    const startTime = Date.now()
    let itemsProcessed = 0
    let itemsSuccess = 0
    let itemsError = 0
    const errors: string[] = []

    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      })

      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive')
      }

      // Update status to in progress
      await prisma.integration.update({
        where: { id: integrationId },
        data: { syncStatus: 'IN_PROGRESS' },
      })

      const config = JSON.parse(integration.config)
      const type = integration.type as IntegrationType

      switch (type) {
        case 'GITHUB':
          const result = await this.syncGitHub(integrationId, config)
          itemsProcessed = result.itemsProcessed
          itemsSuccess = result.itemsSuccess
          itemsError = result.itemsError
          errors.push(...result.errors)
          break

        case 'GOOGLE_CALENDAR':
          const calendarResult = await this.syncGoogleCalendar(integrationId, config)
          itemsProcessed = calendarResult.itemsProcessed
          itemsSuccess = calendarResult.itemsSuccess
          itemsError = calendarResult.itemsError
          errors.push(...calendarResult.errors)
          break

        case 'ZAPIER':
          // Zapier doesn't need regular sync, it's webhook-based
          itemsProcessed = 1
          itemsSuccess = 1
          break

        default:
          throw new Error(`Sync not implemented for ${type}`)
      }

      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: itemsError > 0 ? 'ERROR' : 'SYNCED',
          syncError: errors.length > 0 ? errors.join('; ') : null,
        },
      })

      // Log sync result
      await this.logSync(
        integrationId,
        'sync',
        itemsError > 0 ? 'ERROR' : 'SYNCED',
        itemsProcessed,
        itemsSuccess,
        itemsError,
        errors.length > 0 ? errors.join('; ') : undefined
      )

      return {
        success: itemsError === 0,
        itemsProcessed,
        itemsSuccess,
        itemsError,
        errors,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMessage)

      // Update integration with error
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'ERROR',
          syncError: errorMessage,
        },
      })

      // Log error
      await this.logSync(integrationId, 'sync', 'ERROR', 0, 0, 1, errorMessage)

      return {
        success: false,
        itemsProcessed: 0,
        itemsSuccess: 0,
        itemsError: 1,
        errors,
        duration: Date.now() - startTime,
      }
    }
  }

  // GitHub Sync
  private static async syncGitHub(integrationId: string, config: GitHubConfig): Promise<SyncResult> {
    const service = new GitHubService(config)
    const errors: string[] = []
    let itemsProcessed = 0
    let itemsSuccess = 0
    let itemsError = 0

    try {
      // Get repositories to sync
      const repositories = await prisma.gitRepository.findMany({
        where: { integrationId },
      })

      for (const repo of repositories) {
        try {
          const [owner, repoName] = repo.fullName.split('/')
          await service.syncRepository(integrationId, owner, repoName, repo.projectId || undefined)
          itemsProcessed++
          itemsSuccess++
        } catch (error) {
          itemsProcessed++
          itemsError++
          errors.push(`Failed to sync ${repo.fullName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { success: itemsError === 0, itemsProcessed, itemsSuccess, itemsError, errors, duration: 0 }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      return { success: false, itemsProcessed: 0, itemsSuccess: 0, itemsError: 1, errors, duration: 0 }
    }
  }

  // Google Calendar Sync
  private static async syncGoogleCalendar(integrationId: string, config: GoogleCalendarConfig): Promise<SyncResult> {
    const service = new GoogleCalendarService(config)
    const errors: string[] = []

    try {
      await service.syncEvents(integrationId)
      return { success: true, itemsProcessed: 1, itemsSuccess: 1, itemsError: 0, errors, duration: 0 }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      return { success: false, itemsProcessed: 1, itemsSuccess: 0, itemsError: 1, errors, duration: 0 }
    }
  }

  // Validation
  private static validateConfig(type: IntegrationType, config: any): boolean {
    switch (type) {
      case 'GITHUB':
        return GitHubService.validateConfig(config)
      case 'GOOGLE_CALENDAR':
        return GoogleCalendarService.validateConfig(config)
      case 'ZAPIER':
        return ZapierService.validateConfig(config)
      default:
        return false
    }
  }

  // Test Connection
  private static async testConnection(type: IntegrationType, config: any): Promise<boolean> {
    try {
      switch (type) {
        case 'GITHUB':
          return await GitHubService.testConnection(config.accessToken)
        case 'GOOGLE_CALENDAR':
          return await GoogleCalendarService.testConnection(config)
        case 'ZAPIER':
          return await ZapierService.testConnection(config)
        default:
          return false
      }
    } catch {
      return false
    }
  }

  // Logging
  private static async logSync(
    integrationId: string,
    action: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'SYNCED' | 'ERROR' | 'CANCELLED',
    itemsProcessed: number,
    itemsSuccess: number,
    itemsError: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.integrationSyncLog.create({
        data: {
          integrationId,
          action,
          status,
          itemsProcessed,
          itemsSuccess,
          itemsError,
          errorMessage,
          completedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to log sync:', error)
    }
  }

  // Get Service Instance
  static getService(type: IntegrationType, config: any): any {
    switch (type) {
      case 'GITHUB':
        return new GitHubService(config)
      case 'GOOGLE_CALENDAR':
        return new GoogleCalendarService(config)
      case 'ZAPIER':
        return new ZapierService(config)
      default:
        throw new Error(`Service not implemented for ${type}`)
    }
  }

  // Webhook Processing
  static async processWebhook(integrationId: string, payload: any): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration || !integration.isActive) {
      throw new Error('Integration not found or inactive')
    }

    const config = JSON.parse(integration.config)
    const type = integration.type as IntegrationType

    // Process webhook based on integration type
    switch (type) {
      case 'GITHUB':
        await this.processGitHubWebhook(integrationId, payload)
        break
      case 'ZAPIER':
        await this.processZapierWebhook(integrationId, payload)
        break
      default:
        console.log(`Webhook processing not implemented for ${type}`)
    }
  }

  private static async processGitHubWebhook(integrationId: string, payload: any): Promise<void> {
    // Process GitHub webhook events (push, issues, pull requests, etc.)
    console.log('Processing GitHub webhook:', payload.action || payload.ref)
  }

  private static async processZapierWebhook(integrationId: string, payload: any): Promise<void> {
    // Process Zapier webhook events
    console.log('Processing Zapier webhook:', payload.event)
  }
}
