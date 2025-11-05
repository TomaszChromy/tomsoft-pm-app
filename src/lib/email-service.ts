import nodemailer from 'nodemailer'
import { prisma } from './prisma'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text: string
  notificationId?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@tomsoft.pl',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      })

      console.log('Email sent:', info.messageId)

      // Update notification if provided
      if (emailData.notificationId) {
        await prisma.notification.update({
          where: { id: emailData.notificationId },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
            emailError: null,
          }
        })
      }

      return true
    } catch (error) {
      console.error('Email sending failed:', error)

      // Update notification with error if provided
      if (emailData.notificationId) {
        await prisma.notification.update({
          where: { id: emailData.notificationId },
          data: {
            emailSent: false,
            emailError: error instanceof Error ? error.message : 'Unknown error',
          }
        })
      }

      return false
    }
  }

  // Email templates
  static getTaskAssignedTemplate(data: {
    userName: string
    taskTitle: string
    projectName: string
    assignedBy: string
    taskUrl: string
  }): EmailTemplate {
    const subject = `Nowe zadanie: ${data.taskTitle}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TomSoft PM</h1>
            </div>
            <div class="content">
              <h2>Cześć ${data.userName}!</h2>
              <p>Zostało Ci przypisane nowe zadanie:</p>
              
              <h3>${data.taskTitle}</h3>
              <p><strong>Projekt:</strong> ${data.projectName}</p>
              <p><strong>Przypisane przez:</strong> ${data.assignedBy}</p>
              
              <a href="${data.taskUrl}" class="button">Zobacz zadanie</a>
              
              <p>Zaloguj się do systemu, aby zobaczyć szczegóły zadania.</p>
            </div>
            <div class="footer">
              <p>To jest automatyczna wiadomość z systemu TomSoft PM.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Cześć ${data.userName}!
      
      Zostało Ci przypisane nowe zadanie:
      
      Zadanie: ${data.taskTitle}
      Projekt: ${data.projectName}
      Przypisane przez: ${data.assignedBy}
      
      Link do zadania: ${data.taskUrl}
      
      Zaloguj się do systemu, aby zobaczyć szczegóły zadania.
      
      --
      TomSoft PM
    `
    
    return { subject, html, text }
  }

  static getTaskCompletedTemplate(data: {
    userName: string
    taskTitle: string
    projectName: string
    completedBy: string
    taskUrl: string
  }): EmailTemplate {
    const subject = `Zadanie ukończone: ${data.taskTitle}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16A34A; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TomSoft PM</h1>
            </div>
            <div class="content">
              <h2>Cześć ${data.userName}!</h2>
              <p>Zadanie zostało ukończone:</p>
              
              <h3>${data.taskTitle}</h3>
              <p><strong>Projekt:</strong> ${data.projectName}</p>
              <p><strong>Ukończone przez:</strong> ${data.completedBy}</p>
              
              <a href="${data.taskUrl}" class="button">Zobacz zadanie</a>
              
              <p>Gratulacje! Zadanie zostało pomyślnie ukończone.</p>
            </div>
            <div class="footer">
              <p>To jest automatyczna wiadomość z systemu TomSoft PM.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Cześć ${data.userName}!
      
      Zadanie zostało ukończone:
      
      Zadanie: ${data.taskTitle}
      Projekt: ${data.projectName}
      Ukończone przez: ${data.completedBy}
      
      Link do zadania: ${data.taskUrl}
      
      Gratulacje! Zadanie zostało pomyślnie ukończone.
      
      --
      TomSoft PM
    `
    
    return { subject, html, text }
  }

  static getProjectUpdateTemplate(data: {
    userName: string
    projectName: string
    updateType: string
    updateDescription: string
    updatedBy: string
    projectUrl: string
  }): EmailTemplate {
    const subject = `Aktualizacja projektu: ${data.projectName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7C3AED; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TomSoft PM</h1>
            </div>
            <div class="content">
              <h2>Cześć ${data.userName}!</h2>
              <p>Projekt został zaktualizowany:</p>
              
              <h3>${data.projectName}</h3>
              <p><strong>Typ aktualizacji:</strong> ${data.updateType}</p>
              <p><strong>Opis:</strong> ${data.updateDescription}</p>
              <p><strong>Zaktualizowane przez:</strong> ${data.updatedBy}</p>
              
              <a href="${data.projectUrl}" class="button">Zobacz projekt</a>
              
              <p>Zaloguj się do systemu, aby zobaczyć szczegóły aktualizacji.</p>
            </div>
            <div class="footer">
              <p>To jest automatyczna wiadomość z systemu TomSoft PM.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Cześć ${data.userName}!
      
      Projekt został zaktualizowany:
      
      Projekt: ${data.projectName}
      Typ aktualizacji: ${data.updateType}
      Opis: ${data.updateDescription}
      Zaktualizowane przez: ${data.updatedBy}
      
      Link do projektu: ${data.projectUrl}
      
      Zaloguj się do systemu, aby zobaczyć szczegóły aktualizacji.
      
      --
      TomSoft PM
    `
    
    return { subject, html, text }
  }

  static getDeadlineReminderTemplate(data: {
    userName: string
    taskTitle: string
    projectName: string
    deadline: string
    daysLeft: number
    taskUrl: string
  }): EmailTemplate {
    const subject = `Przypomnienie o terminie: ${data.taskTitle}`
    
    const urgencyColor = data.daysLeft <= 1 ? '#DC2626' : data.daysLeft <= 3 ? '#F59E0B' : '#2563EB'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .urgent { color: ${urgencyColor}; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TomSoft PM</h1>
            </div>
            <div class="content">
              <h2>Cześć ${data.userName}!</h2>
              <p>Przypomnienie o zbliżającym się terminie:</p>
              
              <h3>${data.taskTitle}</h3>
              <p><strong>Projekt:</strong> ${data.projectName}</p>
              <p><strong>Termin:</strong> ${data.deadline}</p>
              <p class="urgent">Pozostało dni: ${data.daysLeft}</p>
              
              <a href="${data.taskUrl}" class="button">Zobacz zadanie</a>
              
              <p>Nie zapomnij ukończyć zadania przed terminem!</p>
            </div>
            <div class="footer">
              <p>To jest automatyczna wiadomość z systemu TomSoft PM.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      Cześć ${data.userName}!
      
      Przypomnienie o zbliżającym się terminie:
      
      Zadanie: ${data.taskTitle}
      Projekt: ${data.projectName}
      Termin: ${data.deadline}
      Pozostało dni: ${data.daysLeft}
      
      Link do zadania: ${data.taskUrl}
      
      Nie zapomnij ukończyć zadania przed terminem!
      
      --
      TomSoft PM
    `
    
    return { subject, html, text }
  }
}
