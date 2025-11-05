import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { IntegrationService } from '@/lib/integrations/integration-service'

// Schema for creating integration
const createIntegrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  type: z.string(),
  config: z.any(),
  isActive: z.boolean().optional(),
  webhookUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
})

// GET /api/integrations - Get user integrations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const integrations = await IntegrationService.getUserIntegrations(user.id)

    // Remove sensitive config data from response
    const sanitizedIntegrations = integrations.map(integration => ({
      ...integration,
      config: undefined, // Don't expose config in list view
      accessToken: undefined,
      refreshToken: undefined,
    }))

    return NextResponse.json({ integrations: sanitizedIntegrations })
  } catch (error) {
    console.error('Get integrations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST /api/integrations - Create new integration
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = createIntegrationSchema.parse(body)

    const integrationId = await IntegrationService.createIntegration(user.id, validatedData)

    return NextResponse.json({ 
      integrationId,
      message: 'Integration created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Create integration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create integration' },
      { status: 500 }
    )
  }
}
