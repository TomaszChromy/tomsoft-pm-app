import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export interface GoogleCalendarConfig {
  accessToken: string
  refreshToken: string
  clientId: string
  clientSecret: string
  calendarId?: string // Default calendar ID, can be 'primary'
}

export interface CalendarEventData {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  recurrence?: string[]
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface CalendarListEntry {
  id: string
  summary: string
  description?: string
  timeZone: string
  accessRole: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

export class GoogleCalendarService {
  private calendar: any
  private oauth2Client: any
  private config: GoogleCalendarConfig

  constructor(config: GoogleCalendarConfig) {
    this.config = config
    
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'http://localhost:3002/api/integrations/google/callback' // Redirect URI
    )

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    })

    // Initialize Calendar API
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  // Calendar Management
  async getCalendars(): Promise<CalendarListEntry[]> {
    try {
      const response = await this.calendar.calendarList.list()
      
      return response.data.items.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        timeZone: calendar.timeZone,
        accessRole: calendar.accessRole,
        primary: calendar.primary,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
      }))
    } catch (error) {
      console.error('Failed to fetch Google calendars:', error)
      throw new Error('Failed to fetch calendars from Google Calendar')
    }
  }

  async getPrimaryCalendar(): Promise<CalendarListEntry> {
    try {
      const response = await this.calendar.calendarList.get({
        calendarId: 'primary'
      })
      
      return {
        id: response.data.id,
        summary: response.data.summary,
        description: response.data.description,
        timeZone: response.data.timeZone,
        accessRole: response.data.accessRole,
        primary: response.data.primary,
        backgroundColor: response.data.backgroundColor,
        foregroundColor: response.data.foregroundColor,
      }
    } catch (error) {
      console.error('Failed to fetch primary calendar:', error)
      throw new Error('Failed to fetch primary calendar')
    }
  }

  // Event Management
  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250
  ): Promise<CalendarEventData[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })
      
      return response.data.items.map((event: any) => ({
        id: event.id,
        summary: event.summary || 'No Title',
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.dateTime,
          date: event.start.date,
          timeZone: event.start.timeZone,
        },
        end: {
          dateTime: event.end.dateTime,
          date: event.end.date,
          timeZone: event.end.timeZone,
        },
        recurrence: event.recurrence,
        attendees: event.attendees?.map((attendee: any) => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })),
        reminders: event.reminders,
      }))
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error)
      throw new Error('Failed to fetch events from Google Calendar')
    }
  }

  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<CalendarEventData> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      })
      
      const event = response.data
      return {
        id: event.id,
        summary: event.summary || 'No Title',
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.dateTime,
          date: event.start.date,
          timeZone: event.start.timeZone,
        },
        end: {
          dateTime: event.end.dateTime,
          date: event.end.date,
          timeZone: event.end.timeZone,
        },
        recurrence: event.recurrence,
        attendees: event.attendees?.map((attendee: any) => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })),
        reminders: event.reminders,
      }
    } catch (error) {
      console.error('Failed to fetch Google Calendar event:', error)
      throw new Error('Failed to fetch event from Google Calendar')
    }
  }

  async createEvent(eventData: CalendarEventData, calendarId: string = 'primary'): Promise<CalendarEventData> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: eventData,
      })
      
      const event = response.data
      return {
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        recurrence: event.recurrence,
        attendees: event.attendees,
        reminders: event.reminders,
      }
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error)
      throw new Error('Failed to create event in Google Calendar')
    }
  }

  async updateEvent(
    eventId: string,
    eventData: Partial<CalendarEventData>,
    calendarId: string = 'primary'
  ): Promise<CalendarEventData> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: eventData,
      })
      
      const event = response.data
      return {
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        recurrence: event.recurrence,
        attendees: event.attendees,
        reminders: event.reminders,
      }
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error)
      throw new Error('Failed to update event in Google Calendar')
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      })
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error)
      throw new Error('Failed to delete event from Google Calendar')
    }
  }

  // Sync with database
  async syncEvents(integrationId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      // Get events from the last 30 days and next 90 days
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      
      const events = await this.getEvents(calendarId, timeMin, timeMax)
      
      for (const event of events) {
        if (!event.id) continue
        
        const startTime = new Date(event.start.dateTime || event.start.date || '')
        const endTime = new Date(event.end.dateTime || event.end.date || '')
        
        await prisma.calendarEvent.upsert({
          where: {
            integrationId_externalId: {
              integrationId,
              externalId: event.id,
            },
          },
          update: {
            title: event.summary,
            description: event.description,
            location: event.location,
            startTime,
            endTime,
            isAllDay: !event.start.dateTime,
            timezone: event.start.timeZone,
            isRecurring: !!event.recurrence,
            recurrenceRule: event.recurrence?.join(';'),
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED',
          },
          create: {
            integrationId,
            externalId: event.id,
            title: event.summary,
            description: event.description,
            location: event.location,
            startTime,
            endTime,
            isAllDay: !event.start.dateTime,
            timezone: event.start.timeZone,
            isRecurring: !!event.recurrence,
            recurrenceRule: event.recurrence?.join(';'),
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED',
          },
        })
      }
      
      // Update integration last sync time
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'SYNCED',
        },
      })
    } catch (error) {
      console.error('Failed to sync Google Calendar events:', error)
      
      // Update integration with error status
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'ERROR',
          syncError: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      
      throw error
    }
  }

  // Create calendar event from task
  async createEventFromTask(task: any, calendarId: string = 'primary'): Promise<string | null> {
    try {
      const eventData: CalendarEventData = {
        summary: `Task: ${task.title}`,
        description: task.description || `Task from TomSoft PM\n\nProject: ${task.project?.name || 'Unknown'}`,
        start: {
          dateTime: task.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: task.dueDate || new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 24 * 60 },
          ],
        },
      }
      
      const createdEvent = await this.createEvent(eventData, calendarId)
      return createdEvent.id || null
    } catch (error) {
      console.error('Failed to create calendar event from task:', error)
      return null
    }
  }

  // Utility methods
  static validateConfig(config: any): config is GoogleCalendarConfig {
    return (
      config &&
      typeof config.accessToken === 'string' &&
      typeof config.refreshToken === 'string' &&
      typeof config.clientId === 'string' &&
      typeof config.clientSecret === 'string'
    )
  }

  static async testConnection(config: GoogleCalendarConfig): Promise<boolean> {
    try {
      const service = new GoogleCalendarService(config)
      await service.getPrimaryCalendar()
      return true
    } catch {
      return false
    }
  }

  // OAuth helpers
  static getAuthUrl(clientId: string, clientSecret: string, scopes: string[] = ['https://www.googleapis.com/auth/calendar']): string {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3002/api/integrations/google/callback'
    )

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    })
  }

  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3002/api/integrations/google/callback'
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
    }
  }
}
