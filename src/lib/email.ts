import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig)

// Email templates
const emailTemplates = {
  taskAssigned: (data: {
    userName: string
    taskTitle: string
    projectName: string
    dueDate?: string
    taskUrl: string
  }) => ({
    subject: `Nowe zadanie: ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TomSoft PM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Nowe zadanie zostało Ci przypisane</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Cześć ${data.userName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Zostało Ci przypisane nowe zadanie w projekcie <strong>${data.projectName}</strong>.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">${data.taskTitle}</h3>
            ${data.dueDate ? `<p style="color: #666; margin: 5px 0;"><strong>Termin:</strong> ${data.dueDate}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.taskUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Zobacz zadanie
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Otrzymujesz tę wiadomość, ponieważ jesteś członkiem zespołu w TomSoft PM.
          </p>
        </div>
      </div>
    `
  }),

  taskCompleted: (data: {
    userName: string
    taskTitle: string
    projectName: string
    completedBy: string
    taskUrl: string
  }) => ({
    subject: `Zadanie ukończone: ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TomSoft PM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Zadanie zostało ukończone</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Cześć ${data.userName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Zadanie w projekcie <strong>${data.projectName}</strong> zostało ukończone przez <strong>${data.completedBy}</strong>.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #333; margin: 0 0 10px 0;">✅ ${data.taskTitle}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Ukończone przez:</strong> ${data.completedBy}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.taskUrl}" 
               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Zobacz zadanie
            </a>
          </div>
        </div>
      </div>
    `
  }),

  projectInvitation: (data: {
    userName: string
    projectName: string
    invitedBy: string
    role: string
    projectUrl: string
  }) => ({
    subject: `Zaproszenie do projektu: ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TomSoft PM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Zaproszenie do współpracy</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Cześć ${data.userName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            <strong>${data.invitedBy}</strong> zaprosił Cię do współpracy w projekcie <strong>${data.projectName}</strong>.
          </p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #333; margin: 0 0 10px 0;">🚀 ${data.projectName}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Twoja rola:</strong> ${data.role}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Zaproszenie od:</strong> ${data.invitedBy}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.projectUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Dołącz do projektu
            </a>
          </div>
        </div>
      </div>
    `
  }),

  deadlineReminder: (data: {
    userName: string
    taskTitle: string
    projectName: string
    dueDate: string
    daysLeft: number
    taskUrl: string
  }) => ({
    subject: `Przypomnienie o terminie: ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TomSoft PM</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Przypomnienie o terminie</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Cześć ${data.userName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Przypominamy o zbliżającym się terminie zadania w projekcie <strong>${data.projectName}</strong>.
          </p>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #333; margin: 0 0 10px 0;">⏰ ${data.taskTitle}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Termin:</strong> ${data.dueDate}</p>
            <p style="color: #d97706; margin: 5px 0; font-weight: bold;">
              ${data.daysLeft > 0 ? `Pozostało ${data.daysLeft} dni` : 'Termin już minął!'}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.taskUrl}" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Zobacz zadanie
            </a>
          </div>
        </div>
      </div>
    `
  })
}

// Email sending functions
export async function sendTaskAssignedEmail(
  to: string,
  data: Parameters<typeof emailTemplates.taskAssigned>[0]
) {
  try {
    const template = emailTemplates.taskAssigned(data)
    
    await transporter.sendMail({
      from: `"TomSoft PM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Task assigned email sent to ${to}`)
  } catch (error) {
    console.error('Error sending task assigned email:', error)
    throw error
  }
}

export async function sendTaskCompletedEmail(
  to: string,
  data: Parameters<typeof emailTemplates.taskCompleted>[0]
) {
  try {
    const template = emailTemplates.taskCompleted(data)
    
    await transporter.sendMail({
      from: `"TomSoft PM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Task completed email sent to ${to}`)
  } catch (error) {
    console.error('Error sending task completed email:', error)
    throw error
  }
}

export async function sendProjectInvitationEmail(
  to: string,
  data: Parameters<typeof emailTemplates.projectInvitation>[0]
) {
  try {
    const template = emailTemplates.projectInvitation(data)
    
    await transporter.sendMail({
      from: `"TomSoft PM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Project invitation email sent to ${to}`)
  } catch (error) {
    console.error('Error sending project invitation email:', error)
    throw error
  }
}

export async function sendDeadlineReminderEmail(
  to: string,
  data: Parameters<typeof emailTemplates.deadlineReminder>[0]
) {
  try {
    const template = emailTemplates.deadlineReminder(data)
    
    await transporter.sendMail({
      from: `"TomSoft PM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Deadline reminder email sent to ${to}`)
  } catch (error) {
    console.error('Error sending deadline reminder email:', error)
    throw error
  }
}

// Bulk email sending
export async function sendBulkEmails(emails: Array<{
  to: string
  subject: string
  html: string
}>) {
  try {
    const promises = emails.map(email =>
      transporter.sendMail({
        from: `"TomSoft PM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        ...email,
      })
    )
    
    await Promise.all(promises)
    console.log(`Bulk emails sent: ${emails.length} emails`)
  } catch (error) {
    console.error('Error sending bulk emails:', error)
    throw error
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}
