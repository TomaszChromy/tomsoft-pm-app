import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { IntegrationService } from '@/lib/integrations/integration-service'

// POST /api/integrations/[id]/sync - Trigger integration sync
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const integrationId = params.id

    // Verify user owns this integration
    const integration = await IntegrationService.getIntegration(integrationId, user.id)
    
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'Integration is not active' },
        { status: 400 }
      )
    }

    // Trigger sync
    const result = await IntegrationService.syncIntegration(integrationId)

    return NextResponse.json({ 
      message: 'Sync completed',
      result 
    })
  } catch (error) {
    console.error('Sync integration error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync integration' },
      { status: 500 }
    )
  }
}
