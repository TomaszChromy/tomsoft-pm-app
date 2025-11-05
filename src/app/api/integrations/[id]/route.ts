import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { IntegrationService } from '@/lib/integrations/integration-service'

// Schema for updating integration
const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
})

// GET /api/integrations/[id] - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const integrationId = params.id

    const integration = await IntegrationService.getIntegration(integrationId, user.id)

    // Remove sensitive data
    const sanitizedIntegration = {
      ...integration,
      accessToken: integration.accessToken ? '***' : null,
      refreshToken: integration.refreshToken ? '***' : null,
      config: integration.config ? JSON.parse(integration.config) : null,
    }

    // Mask sensitive config values
    if (sanitizedIntegration.config) {
      if (sanitizedIntegration.config.accessToken) {
        sanitizedIntegration.config.accessToken = '***'
      }
      if (sanitizedIntegration.config.refreshToken) {
        sanitizedIntegration.config.refreshToken = '***'
      }
      if (sanitizedIntegration.config.apiToken) {
        sanitizedIntegration.config.apiToken = '***'
      }
      if (sanitizedIntegration.config.clientSecret) {
        sanitizedIntegration.config.clientSecret = '***'
      }
    }

    return NextResponse.json({ integration: sanitizedIntegration })
  } catch (error) {
    console.error('Get integration error:', error)
    
    if (error instanceof Error && error.message === 'Integration not found') {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

// PUT /api/integrations/[id] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const integrationId = params.id
    const body = await request.json()
    
    const validatedData = updateIntegrationSchema.parse(body)

    await IntegrationService.updateIntegration(integrationId, user.id, validatedData)

    return NextResponse.json({ 
      message: 'Integration updated successfully' 
    })
  } catch (error) {
    console.error('Update integration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Integration not found') {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update integration' },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const integrationId = params.id

    await IntegrationService.deleteIntegration(integrationId, user.id)

    return NextResponse.json({ 
      message: 'Integration deleted successfully' 
    })
  } catch (error) {
    console.error('Delete integration error:', error)
    
    if (error instanceof Error && error.message === 'Integration not found') {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
