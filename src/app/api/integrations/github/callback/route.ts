import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { IntegrationService } from '@/lib/integrations/integration-service'

// GET /api/integrations/github/callback - GitHub OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(tokenData.error)}`, request.url)
      )
    }

    // Store the access token temporarily in session or redirect with token
    // For security, we'll redirect to a page where user can complete the setup
    const redirectUrl = new URL('/integrations/github/setup', request.url)
    redirectUrl.searchParams.set('token', tokenData.access_token)
    if (state) redirectUrl.searchParams.set('state', state)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/integrations?error=oauth_failed', request.url)
    )
  }
}

// POST /api/integrations/github/callback - Complete GitHub integration setup
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const { accessToken, name, repositories } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Create GitHub integration
    const integrationId = await IntegrationService.createIntegration(user.id, {
      name: name || 'GitHub Integration',
      type: 'GITHUB',
      config: {
        accessToken,
        syncCommits: true,
        syncIssues: true,
        syncPRs: true,
      },
      isActive: true,
    })

    // If repositories are selected, add them
    if (repositories && repositories.length > 0) {
      // This would be implemented to add selected repositories
      // For now, we'll just return success
    }

    return NextResponse.json({ 
      integrationId,
      message: 'GitHub integration created successfully' 
    })
  } catch (error) {
    console.error('GitHub integration setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup GitHub integration' },
      { status: 500 }
    )
  }
}
