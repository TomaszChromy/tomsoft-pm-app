import twilio from 'twilio'

export interface SMSMessage {
  to: string
  body: string
  from?: string
}

export class SMSService {
  private client: twilio.Twilio | null = null
  private fromNumber: string

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || ''

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken)
    }
  }

  async sendSMS(message: SMSMessage): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not configured')
      }

      if (!this.fromNumber) {
        throw new Error('Twilio from number not configured')
      }

      await this.client.messages.create({
        body: message.body,
        from: message.from || this.fromNumber,
        to: message.to,
      })

      return true
    } catch (error) {
      console.error('SMS sending failed:', error)
      return false
    }
  }

  // Predefined SMS templates
  static getTaskAssignedSMS(data: {
    userName: string
    taskTitle: string
    projectName: string
    assignedBy: string
  }): string {
    return `📋 TomSoft PM: Nowe zadanie "${data.taskTitle}" w projekcie ${data.projectName} zostało Ci przypisane przez ${data.assignedBy}.`
  }

  static getTaskCompletedSMS(data: {
    taskTitle: string
    projectName: string
    completedBy: string
  }): string {
    return `✅ TomSoft PM: Zadanie "${data.taskTitle}" w projekcie ${data.projectName} zostało ukończone przez ${data.completedBy}.`
  }

  static getProjectUpdateSMS(data: {
    projectName: string
    updateType: string
    updatedBy: string
  }): string {
    return `🔄 TomSoft PM: Projekt ${data.projectName} został zaktualizowany (${data.updateType}) przez ${data.updatedBy}.`
  }

  static getDeadlineReminderSMS(data: {
    taskTitle: string
    projectName: string
    daysLeft: number
  }): string {
    const urgencyEmoji = data.daysLeft <= 1 ? '🚨' : data.daysLeft <= 3 ? '⚠️' : '📅'
    return `${urgencyEmoji} TomSoft PM: Przypomnienie - zadanie "${data.taskTitle}" w projekcie ${data.projectName} kończy się za ${data.daysLeft} dni.`
  }

  static getSprintStartSMS(data: {
    sprintName: string
    projectName: string
    startDate: string
  }): string {
    return `🚀 TomSoft PM: Sprint "${data.sprintName}" w projekcie ${data.projectName} rozpoczął się ${data.startDate}.`
  }

  static getSprintCompletedSMS(data: {
    sprintName: string
    projectName: string
    completionRate: number
  }): string {
    return `🏁 TomSoft PM: Sprint "${data.sprintName}" w projekcie ${data.projectName} zakończony z wynikiem ${data.completionRate}%.`
  }

  static getUrgentNotificationSMS(data: {
    title: string
    message: string
  }): string {
    return `🚨 TomSoft PM PILNE: ${data.title} - ${data.message}`
  }

  static getSystemAlertSMS(data: {
    alertType: string
    description: string
  }): string {
    return `⚠️ TomSoft PM Alert: ${data.alertType} - ${data.description}`
  }

  // Utility methods
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if missing (assuming Poland +48)
    if (cleaned.length === 9 && !cleaned.startsWith('48')) {
      return `+48${cleaned}`
    }
    
    // Add + if missing
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`
    }
    
    return cleaned
  }

  static validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    
    // Basic validation - should be at least 9 digits
    if (cleaned.length < 9) {
      return false
    }
    
    // Polish phone number validation
    if (cleaned.length === 9 || (cleaned.length === 11 && cleaned.startsWith('48'))) {
      return true
    }
    
    // International format validation (basic)
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return true
    }
    
    return false
  }

  static truncateMessage(message: string, maxLength: number = 160): string {
    if (message.length <= maxLength) {
      return message
    }
    
    return message.substring(0, maxLength - 3) + '...'
  }

  // Check if SMS should be sent based on priority and settings
  static shouldSendSMS(priority: string, urgentOnly: boolean): boolean {
    if (urgentOnly) {
      return priority === 'HIGH' || priority === 'URGENT'
    }
    
    return true
  }

  // Get SMS cost estimation (basic)
  static estimateCost(messageCount: number, country: string = 'PL'): number {
    const rates: { [key: string]: number } = {
      'PL': 0.05, // 5 groszy per SMS
      'US': 0.0075, // $0.0075 per SMS
      'UK': 0.04, // £0.04 per SMS
      'DE': 0.075, // €0.075 per SMS
    }
    
    const rate = rates[country] || 0.1 // Default rate
    return messageCount * rate
  }

  // Split long messages into multiple SMS
  static splitMessage(message: string, maxLength: number = 160): string[] {
    if (message.length <= maxLength) {
      return [message]
    }
    
    const parts: string[] = []
    let remaining = message
    
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        parts.push(remaining)
        break
      }
      
      // Find the last space before maxLength to avoid breaking words
      let splitIndex = maxLength
      const lastSpace = remaining.lastIndexOf(' ', maxLength)
      
      if (lastSpace > maxLength * 0.8) { // Only split on space if it's not too far back
        splitIndex = lastSpace
      }
      
      parts.push(remaining.substring(0, splitIndex))
      remaining = remaining.substring(splitIndex).trim()
    }
    
    return parts
  }

  // Batch SMS sending
  async sendBatchSMS(messages: SMSMessage[]): Promise<{ success: number; failed: number; results: boolean[] }> {
    const results: boolean[] = []
    let success = 0
    let failed = 0
    
    for (const message of messages) {
      const result = await this.sendSMS(message)
      results.push(result)
      
      if (result) {
        success++
      } else {
        failed++
      }
      
      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return { success, failed, results }
  }

  // Schedule SMS (basic implementation - in production use a job queue)
  async scheduleSMS(message: SMSMessage, sendAt: Date): Promise<boolean> {
    const now = new Date()
    const delay = sendAt.getTime() - now.getTime()
    
    if (delay <= 0) {
      // Send immediately if scheduled time has passed
      return this.sendSMS(message)
    }
    
    // Schedule for later (in production, use a proper job queue like Bull or Agenda)
    setTimeout(async () => {
      await this.sendSMS(message)
    }, delay)
    
    return true
  }
}
