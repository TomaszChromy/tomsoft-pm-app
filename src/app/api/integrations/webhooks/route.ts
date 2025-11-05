import { NextRequest, NextResponse } from 'next/server'
import { IntegrationService } from '@/lib/integrations/integration-service'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST /api/integrations/webhooks - Generic webhook receiver
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integration')
    const provider = searchParams.get('provider')

    if (!integrationId || !provider) {
      return NextResponse.json(
        { error: 'Integration ID and provider are required' },
        { status: 400 }
      )
    }

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'Integration not found or inactive' },
        { status: 404 }
      )
    }

    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    // Verify webhook signature if secret is configured
    if (integration.webhookSecret) {
      const signature = headers['x-hub-signature-256'] || headers['x-signature']
      
      if (!signature || !verifyWebhookSignature(body, signature, integration.webhookSecret)) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }

    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      payload = { raw: body }
    }

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        integrationId,
        method: 'POST',
        url: request.url,
        headers: JSON.stringify(headers),
        payload: body,
        statusCode: 200,
        processed: false,
      },
    })

    // Process webhook based on provider
    switch (provider.toLowerCase()) {
      case 'github':
        await processGitHubWebhook(integration, payload, headers)
        break
      case 'zapier':
        await processZapierWebhook(integration, payload)
        break
      case 'jira':
        await processJiraWebhook(integration, payload)
        break
      default:
        console.log(`Webhook processing not implemented for provider: ${provider}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GitHub webhook processing
async function processGitHubWebhook(integration: any, payload: any, headers: any): Promise<void> {
  const event = headers['x-github-event']
  
  switch (event) {
    case 'push':
      console.log(`GitHub push to ${payload.repository?.full_name}: ${payload.commits?.length || 0} commits`)
      // Here you could create tasks or notifications based on commits
      break
      
    case 'issues':
      if (payload.action === 'opened') {
        console.log(`New GitHub issue: ${payload.issue?.title}`)
        // Here you could create a task from the GitHub issue
      }
      break
      
    case 'pull_request':
      if (payload.action === 'opened') {
        console.log(`New GitHub PR: ${payload.pull_request?.title}`)
        // Here you could create a task for code review
      }
      break
      
    default:
      console.log(`Unhandled GitHub event: ${event}`)
  }
}

// Zapier webhook processing
async function processZapierWebhook(integration: any, payload: any): Promise<void> {
  const event = payload.event
  
  switch (event) {
    case 'task.create':
      console.log(`Zapier task creation request: ${payload.data?.title}`)
      // Here you could create a task based on Zapier data
      break
      
    case 'project.create':
      console.log(`Zapier project creation request: ${payload.data?.name}`)
      // Here you could create a project based on Zapier data
      break
      
    default:
      console.log(`Unhandled Zapier event: ${event}`)
  }
}

// Jira webhook processing
async function processJiraWebhook(integration: any, payload: any): Promise<void> {
  const eventType = payload.webhookEvent
  
  switch (eventType) {
    case 'jira:issue_created':
      console.log(`New Jira issue: ${payload.issue?.fields?.summary}`)
      // Here you could create a task from the Jira issue
      break
      
    case 'jira:issue_updated':
      console.log(`Jira issue updated: ${payload.issue?.fields?.summary}`)
      // Here you could update the corresponding task
      break
      
    default:
      console.log(`Unhandled Jira event: ${eventType}`)
  }
}

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // GitHub style signature (sha256=...)
    if (signature.startsWith('sha256=')) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    }
    
    // Simple HMAC verification
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
