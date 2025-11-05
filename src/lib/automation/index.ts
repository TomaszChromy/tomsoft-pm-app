/**
 * Main automation system
 * Orchestrates all automation components
 */

import { AutomatedTesting } from './testing'
import { CICDPipeline, DeploymentAutomation, PipelineConfigs } from './ci-cd'
import { AutomatedBackup } from './backup'
import { TaskAutomation, AutomationTemplates } from './task-automation'

interface AutomationConfig {
  testing: {
    enabled: boolean
    schedule: string
    environments: string[]
  }
  cicd: {
    enabled: boolean
    environments: ('development' | 'staging' | 'production')[]
    autoTrigger: boolean
  }
  backup: {
    enabled: boolean
    schedule: string
    retention: {
      daily: number
      weekly: number
      monthly: number
    }
    storage: {
      local: boolean
      cloud: boolean
    }
  }
  taskAutomation: {
    enabled: boolean
    templates: string[]
  }
}

interface AutomationStatus {
  component: string
  status: 'running' | 'stopped' | 'error'
  lastRun?: Date
  nextRun?: Date
  message?: string
}

export class AutomationOrchestrator {
  private config: AutomationConfig
  private testing: AutomatedTesting
  private cicdPipelines: Map<string, CICDPipeline> = new Map()
  private backup: AutomatedBackup
  private taskAutomation: TaskAutomation
  private isRunning = false
  private status: AutomationStatus[] = []

  constructor(config: AutomationConfig) {
    this.config = config
    this.initializeComponents()
  }

  /**
   * Initialize all automation components
   */
  private initializeComponents(): void {
    console.log('🔧 Initializing automation components...')

    // Initialize testing
    this.testing = new AutomatedTesting({
      environment: 'development',
      baseUrl: 'http://localhost:3002',
      timeout: 30000,
      retries: 2,
      parallel: true
    })

    // Initialize CI/CD pipelines
    if (this.config.cicd.enabled) {
      this.config.cicd.environments.forEach(env => {
        const pipeline = new CICDPipeline(PipelineConfigs[env])
        this.cicdPipelines.set(env, pipeline)
      })
    }

    // Initialize backup system
    if (this.config.backup.enabled) {
      this.backup = new AutomatedBackup({
        schedule: this.config.backup.schedule,
        retention: this.config.backup.retention,
        storage: {
          local: this.config.backup.storage.local,
          s3: this.config.backup.storage.cloud ? {
            bucket: 'tomsoft-pm-backups',
            region: 'eu-west-1',
            accessKey: process.env.AWS_ACCESS_KEY || '',
            secretKey: process.env.AWS_SECRET_KEY || ''
          } : undefined
        },
        compression: true,
        encryption: true,
        notifications: {
          email: ['admin@tomsoft.pl']
        }
      })
    }

    // Initialize task automation
    if (this.config.taskAutomation.enabled) {
      this.taskAutomation = new TaskAutomation()
      this.setupTaskAutomationTemplates()
    }

    console.log('✅ Automation components initialized')
  }

  /**
   * Start all automation systems
   */
  async start(): Promise<void> {
    console.log('🚀 Starting automation orchestrator...')
    this.isRunning = true

    // Start testing automation
    if (this.config.testing.enabled) {
      this.startTestingAutomation()
    }

    // Start backup automation
    if (this.config.backup.enabled) {
      this.backup.startScheduler()
      this.updateStatus('backup', 'running', 'Backup scheduler started')
    }

    // Start task automation
    if (this.config.taskAutomation.enabled) {
      this.taskAutomation.start()
      this.updateStatus('task-automation', 'running', 'Task automation engine started')
    }

    console.log('✅ All automation systems started')
  }

  /**
   * Stop all automation systems
   */
  async stop(): Promise<void> {
    console.log('⏹️ Stopping automation orchestrator...')
    this.isRunning = false

    // Stop backup automation
    if (this.backup) {
      this.backup.stopScheduler()
      this.updateStatus('backup', 'stopped', 'Backup scheduler stopped')
    }

    // Stop task automation
    if (this.taskAutomation) {
      this.taskAutomation.stop()
      this.updateStatus('task-automation', 'stopped', 'Task automation engine stopped')
    }

    console.log('✅ All automation systems stopped')
  }

  /**
   * Run automated tests
   */
  async runTests(): Promise<void> {
    console.log('🧪 Running automated tests...')
    this.updateStatus('testing', 'running', 'Running automated tests')

    try {
      // Run all test suites
      const unitTests = await this.testing.runUnitTests()
      const integrationTests = await this.testing.runIntegrationTests()
      const e2eTests = await this.testing.runE2ETests()

      // Generate report
      const report = this.testing.generateReport()
      console.log(report)

      this.updateStatus('testing', 'running', 'Tests completed successfully')
    } catch (error) {
      console.error('❌ Testing failed:', error)
      this.updateStatus('testing', 'error', `Testing failed: ${error}`)
    }
  }

  /**
   * Run CI/CD pipeline
   */
  async runCICD(environment: 'development' | 'staging' | 'production'): Promise<boolean> {
    console.log(`🚀 Running CI/CD pipeline for ${environment}...`)
    
    const pipeline = this.cicdPipelines.get(environment)
    if (!pipeline) {
      console.error(`❌ No pipeline configured for ${environment}`)
      return false
    }

    this.updateStatus(`cicd-${environment}`, 'running', `Running ${environment} pipeline`)

    try {
      const success = await pipeline.runPipeline()
      
      if (success) {
        this.updateStatus(`cicd-${environment}`, 'running', `${environment} pipeline completed successfully`)
      } else {
        this.updateStatus(`cicd-${environment}`, 'error', `${environment} pipeline failed`)
      }

      return success
    } catch (error) {
      console.error(`❌ CI/CD pipeline failed for ${environment}:`, error)
      this.updateStatus(`cicd-${environment}`, 'error', `Pipeline failed: ${error}`)
      return false
    }
  }

  /**
   * Run backup
   */
  async runBackup(): Promise<void> {
    console.log('💾 Running backup...')
    this.updateStatus('backup', 'running', 'Running backup')

    try {
      const result = await this.backup.runFullBackup()
      
      if (result.status === 'success') {
        this.updateStatus('backup', 'running', 'Backup completed successfully')
      } else {
        this.updateStatus('backup', 'error', `Backup failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Backup failed:', error)
      this.updateStatus('backup', 'error', `Backup failed: ${error}`)
    }
  }

  /**
   * Setup task automation templates
   */
  private setupTaskAutomationTemplates(): void {
    console.log('📋 Setting up task automation templates...')

    // Add predefined templates
    this.config.taskAutomation.templates.forEach(templateName => {
      const template = AutomationTemplates[templateName as keyof typeof AutomationTemplates]
      if (template) {
        this.taskAutomation.addRule({
          ...template,
          createdBy: 'system'
        })
      }
    })

    console.log('✅ Task automation templates configured')
  }

  /**
   * Start testing automation
   */
  private startTestingAutomation(): void {
    console.log('🧪 Starting testing automation...')
    
    // Schedule regular test runs
    setInterval(async () => {
      if (!this.isRunning) return
      
      console.log('⏰ Running scheduled tests...')
      await this.runTests()
    }, this.parseSchedule(this.config.testing.schedule))

    this.updateStatus('testing', 'running', 'Testing automation scheduled')
  }

  /**
   * Parse schedule string to milliseconds
   */
  private parseSchedule(schedule: string): number {
    // Simple schedule parser (in real implementation, use node-cron)
    const scheduleMap: Record<string, number> = {
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000
    }
    
    return scheduleMap[schedule] || 24 * 60 * 60 * 1000 // Default to daily
  }

  /**
   * Update component status
   */
  private updateStatus(component: string, status: 'running' | 'stopped' | 'error', message?: string): void {
    const existingIndex = this.status.findIndex(s => s.component === component)
    
    const statusUpdate: AutomationStatus = {
      component,
      status,
      lastRun: new Date(),
      message
    }

    if (existingIndex >= 0) {
      this.status[existingIndex] = statusUpdate
    } else {
      this.status.push(statusUpdate)
    }
  }

  /**
   * Get automation status
   */
  getStatus(): AutomationStatus[] {
    return this.status
  }

  /**
   * Get comprehensive automation report
   */
  generateReport(): string {
    let report = `
🤖 AUTOMATION SYSTEM REPORT
===========================

📊 System Status:
- Running: ${this.isRunning ? 'Yes' : 'No'}
- Components: ${this.status.length}
- Active: ${this.status.filter(s => s.status === 'running').length}
- Errors: ${this.status.filter(s => s.status === 'error').length}

📋 Component Status:
`

    this.status.forEach(status => {
      const statusIcon = {
        running: '✅',
        stopped: '⏹️',
        error: '❌'
      }[status.status]

      report += `${statusIcon} ${status.component}: ${status.status}`
      if (status.message) {
        report += ` - ${status.message}`
      }
      if (status.lastRun) {
        report += ` (Last: ${status.lastRun.toISOString()})`
      }
      report += '\n'
    })

    // Add component-specific reports
    if (this.testing) {
      report += '\n🧪 Testing Report:\n'
      report += this.testing.generateReport()
    }

    if (this.backup) {
      const backupStats = this.backup.getBackupStats()
      report += `
💾 Backup Statistics:
- Total Backups: ${backupStats.totalBackups}
- Successful: ${backupStats.successfulBackups}
- Failed: ${backupStats.failedBackups}
- Total Size: ${this.formatBytes(backupStats.totalSize)}
- Average Duration: ${Math.round(backupStats.averageDuration / 1000)}s
`
    }

    if (this.taskAutomation) {
      const automationStats = this.taskAutomation.getStats()
      report += `
📋 Task Automation Statistics:
- Total Rules: ${automationStats.totalRules}
- Enabled Rules: ${automationStats.enabledRules}
- Total Executions: ${automationStats.totalExecutions}
- Successful: ${automationStats.successfulExecutions}
- Failed: ${automationStats.failedExecutions}
- Average Execution Time: ${Math.round(automationStats.averageExecutionTime)}ms
`
    }

    return report
  }

  /**
   * Helper method to format bytes
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

/**
 * Default automation configuration
 */
export const DefaultAutomationConfig: AutomationConfig = {
  testing: {
    enabled: true,
    schedule: 'daily',
    environments: ['development', 'staging']
  },
  cicd: {
    enabled: true,
    environments: ['development', 'staging', 'production'],
    autoTrigger: true
  },
  backup: {
    enabled: true,
    schedule: 'daily',
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12
    },
    storage: {
      local: true,
      cloud: true
    }
  },
  taskAutomation: {
    enabled: true,
    templates: ['autoAssignTasks', 'highPriorityNotification', 'autoCompleteProject', 'deadlineReminder']
  }
}

// Export main automation instance
export const automationOrchestrator = new AutomationOrchestrator(DefaultAutomationConfig)
