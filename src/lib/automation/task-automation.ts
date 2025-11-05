/**
 * Task automation system
 * Handles automated workflows, task assignments, and project management
 */

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  enabled: boolean
  createdBy: string
  createdAt: Date
  lastExecuted?: Date
  executionCount: number
}

interface AutomationTrigger {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'project_created' | 'user_assigned' | 'deadline_approaching' | 'schedule'
  schedule?: string // Cron expression for scheduled triggers
  conditions?: Record<string, any>
}

interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
}

interface AutomationAction {
  type: 'assign_user' | 'update_status' | 'send_notification' | 'create_task' | 'update_priority' | 'add_comment' | 'send_email' | 'webhook'
  parameters: Record<string, any>
}

interface AutomationExecution {
  id: string
  ruleId: string
  triggeredBy: string
  triggeredAt: Date
  status: 'success' | 'failed' | 'partial'
  actionsExecuted: number
  totalActions: number
  duration: number
  error?: string
  logs: string[]
}

export class TaskAutomation {
  private rules: AutomationRule[] = []
  private executions: AutomationExecution[] = []
  private isRunning = false

  /**
   * Start automation engine
   */
  start(): void {
    console.log('🤖 Starting task automation engine...')
    this.isRunning = true
    this.startScheduledTasks()
  }

  /**
   * Stop automation engine
   */
  stop(): void {
    console.log('⏹️ Stopping task automation engine...')
    this.isRunning = false
  }

  /**
   * Add automation rule
   */
  addRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): string {
    const newRule: AutomationRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: new Date(),
      executionCount: 0
    }

    this.rules.push(newRule)
    console.log(`✅ Added automation rule: ${newRule.name}`)
    
    return newRule.id
  }

  /**
   * Update automation rule
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return false

    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates }
    console.log(`✅ Updated automation rule: ${ruleId}`)
    
    return true
  }

  /**
   * Delete automation rule
   */
  deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return false

    this.rules.splice(ruleIndex, 1)
    console.log(`✅ Deleted automation rule: ${ruleId}`)
    
    return true
  }

  /**
   * Execute automation rules for a trigger
   */
  async executeTrigger(triggerType: string, data: any): Promise<void> {
    if (!this.isRunning) return

    const applicableRules = this.rules.filter(rule => 
      rule.enabled && rule.trigger.type === triggerType
    )

    for (const rule of applicableRules) {
      if (this.evaluateConditions(rule.conditions, data)) {
        await this.executeRule(rule, data)
      }
    }
  }

  /**
   * Execute a specific automation rule
   */
  private async executeRule(rule: AutomationRule, triggerData: any): Promise<void> {
    console.log(`🔄 Executing automation rule: ${rule.name}`)
    
    const execution: AutomationExecution = {
      id: this.generateExecutionId(),
      ruleId: rule.id,
      triggeredBy: triggerData.userId || 'system',
      triggeredAt: new Date(),
      status: 'success',
      actionsExecuted: 0,
      totalActions: rule.actions.length,
      duration: 0,
      logs: []
    }

    const startTime = Date.now()

    try {
      for (const action of rule.actions) {
        await this.executeAction(action, triggerData, execution)
        execution.actionsExecuted++
      }

      execution.duration = Date.now() - startTime
      execution.status = 'success'
      
      // Update rule execution count
      rule.executionCount++
      rule.lastExecuted = new Date()

      console.log(`✅ Automation rule executed successfully: ${rule.name}`)

    } catch (error) {
      execution.duration = Date.now() - startTime
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.logs.push(`Error: ${execution.error}`)

      console.error(`❌ Automation rule failed: ${rule.name}`, error)
    }

    this.executions.push(execution)
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: AutomationAction, triggerData: any, execution: AutomationExecution): Promise<void> {
    execution.logs.push(`Executing action: ${action.type}`)

    switch (action.type) {
      case 'assign_user':
        await this.assignUser(action.parameters, triggerData)
        break
      
      case 'update_status':
        await this.updateStatus(action.parameters, triggerData)
        break
      
      case 'send_notification':
        await this.sendNotification(action.parameters, triggerData)
        break
      
      case 'create_task':
        await this.createTask(action.parameters, triggerData)
        break
      
      case 'update_priority':
        await this.updatePriority(action.parameters, triggerData)
        break
      
      case 'add_comment':
        await this.addComment(action.parameters, triggerData)
        break
      
      case 'send_email':
        await this.sendEmail(action.parameters, triggerData)
        break
      
      case 'webhook':
        await this.callWebhook(action.parameters, triggerData)
        break
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }

    execution.logs.push(`Action completed: ${action.type}`)
  }

  /**
   * Action implementations
   */
  private async assignUser(parameters: any, triggerData: any): Promise<void> {
    console.log(`👤 Assigning user ${parameters.userId} to task ${triggerData.taskId}`)
    // Mock user assignment
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async updateStatus(parameters: any, triggerData: any): Promise<void> {
    console.log(`📝 Updating status to ${parameters.status} for task ${triggerData.taskId}`)
    // Mock status update
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async sendNotification(parameters: any, triggerData: any): Promise<void> {
    console.log(`🔔 Sending notification: ${parameters.message}`)
    // Mock notification
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async createTask(parameters: any, triggerData: any): Promise<void> {
    console.log(`📋 Creating new task: ${parameters.title}`)
    // Mock task creation
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  private async updatePriority(parameters: any, triggerData: any): Promise<void> {
    console.log(`⚡ Updating priority to ${parameters.priority} for task ${triggerData.taskId}`)
    // Mock priority update
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async addComment(parameters: any, triggerData: any): Promise<void> {
    console.log(`💬 Adding comment: ${parameters.comment}`)
    // Mock comment addition
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async sendEmail(parameters: any, triggerData: any): Promise<void> {
    console.log(`📧 Sending email to ${parameters.to}: ${parameters.subject}`)
    // Mock email sending
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  private async callWebhook(parameters: any, triggerData: any): Promise<void> {
    console.log(`🔗 Calling webhook: ${parameters.url}`)
    // Mock webhook call
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Evaluate automation conditions
   */
  private evaluateConditions(conditions: AutomationCondition[], data: any): boolean {
    if (conditions.length === 0) return true

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(data, condition.field)
      return this.evaluateCondition(fieldValue, condition.operator, condition.value)
    })
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue
      
      case 'not_equals':
        return fieldValue !== expectedValue
      
      case 'contains':
        return String(fieldValue).includes(String(expectedValue))
      
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue)
      
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue)
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
      
      default:
        return false
    }
  }

  /**
   * Get field value from data object
   */
  private getFieldValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data)
  }

  /**
   * Start scheduled tasks
   */
  private startScheduledTasks(): void {
    // Mock scheduled task runner
    setInterval(() => {
      if (!this.isRunning) return

      const scheduledRules = this.rules.filter(rule => 
        rule.enabled && rule.trigger.type === 'schedule' && rule.trigger.schedule
      )

      scheduledRules.forEach(rule => {
        // In real implementation, use node-cron to check if rule should run
        if (this.shouldRunScheduledRule(rule)) {
          this.executeRule(rule, { type: 'scheduled', timestamp: new Date() })
        }
      })
    }, 60000) // Check every minute
  }

  /**
   * Check if scheduled rule should run
   */
  private shouldRunScheduledRule(rule: AutomationRule): boolean {
    // Mock schedule evaluation
    // In real implementation, parse cron expression and check against current time
    return Math.random() < 0.1 // 10% chance for demo
  }

  /**
   * Helper methods
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get automation rules
   */
  getRules(): AutomationRule[] {
    return this.rules
  }

  /**
   * Get execution history
   */
  getExecutions(): AutomationExecution[] {
    return this.executions
  }

  /**
   * Get automation statistics
   */
  getStats(): {
    totalRules: number
    enabledRules: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
  } {
    const totalRules = this.rules.length
    const enabledRules = this.rules.filter(r => r.enabled).length
    const totalExecutions = this.executions.length
    const successfulExecutions = this.executions.filter(e => e.status === 'success').length
    const failedExecutions = this.executions.filter(e => e.status === 'failed').length
    const averageExecutionTime = this.executions.reduce((sum, e) => sum + e.duration, 0) / totalExecutions

    return {
      totalRules,
      enabledRules,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime
    }
  }
}

/**
 * Predefined automation templates
 */
export const AutomationTemplates = {
  /**
   * Auto-assign tasks based on project team
   */
  autoAssignTasks: {
    name: 'Auto-assign tasks to team members',
    description: 'Automatically assign new tasks to available team members',
    trigger: { type: 'task_created' as const },
    conditions: [
      { field: 'project.hasTeam', operator: 'equals' as const, value: true }
    ],
    actions: [
      { 
        type: 'assign_user' as const, 
        parameters: { strategy: 'round_robin' } 
      }
    ],
    enabled: true
  },

  /**
   * Notify on high priority tasks
   */
  highPriorityNotification: {
    name: 'Notify on high priority tasks',
    description: 'Send notifications when high priority tasks are created',
    trigger: { type: 'task_created' as const },
    conditions: [
      { field: 'priority', operator: 'in' as const, value: ['HIGH', 'URGENT'] }
    ],
    actions: [
      { 
        type: 'send_notification' as const, 
        parameters: { 
          message: 'High priority task created: {{task.title}}',
          recipients: ['project_manager', 'team_lead']
        } 
      }
    ],
    enabled: true
  },

  /**
   * Auto-update status on completion
   */
  autoCompleteProject: {
    name: 'Auto-complete project when all tasks done',
    description: 'Automatically mark project as completed when all tasks are done',
    trigger: { type: 'task_completed' as const },
    conditions: [
      { field: 'project.remainingTasks', operator: 'equals' as const, value: 0 }
    ],
    actions: [
      { 
        type: 'update_status' as const, 
        parameters: { status: 'COMPLETED', target: 'project' } 
      },
      {
        type: 'send_email' as const,
        parameters: {
          to: '{{project.owner.email}}',
          subject: 'Project Completed: {{project.name}}',
          template: 'project_completion'
        }
      }
    ],
    enabled: true
  },

  /**
   * Deadline reminder
   */
  deadlineReminder: {
    name: 'Deadline reminder notifications',
    description: 'Send reminders for tasks approaching deadline',
    trigger: { 
      type: 'schedule' as const,
      schedule: '0 9 * * *' // Daily at 9 AM
    },
    conditions: [
      { field: 'dueDate', operator: 'less_than' as const, value: '{{now + 2 days}}' },
      { field: 'status', operator: 'not_in' as const, value: ['DONE', 'CANCELLED'] }
    ],
    actions: [
      {
        type: 'send_notification' as const,
        parameters: {
          message: 'Task deadline approaching: {{task.title}} (Due: {{task.dueDate}})',
          recipients: ['{{task.assignee}}']
        }
      }
    ],
    enabled: true
  }
}
