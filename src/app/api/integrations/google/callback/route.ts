import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { IntegrationService } from '@/lib/integrations/integration-service'
import { GoogleCalendarService } from '@/lib/integrations/google-calendar-service'

// GET /api/integrations/google/callback - Google OAuth callback
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

    // Exchange code for tokens
    const tokens = await GoogleCalendarService.exchangeCodeForTokens(
      code,
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    )

    // Store the tokens temporarily and redirect to setup page
    const redirectUrl = new URL('/integrations/google/setup', request.url)
    redirectUrl.searchParams.set('access_token', tokens.accessToken)
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken)
    if (state) redirectUrl.searchParams.set('state', state)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/integrations?error=oauth_failed', request.url)
    )
  }
}

// POST /api/integrations/google/callback - Complete Google Calendar integration setup
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const { accessToken, refreshToken, name, calendarId } = body

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Access token and refresh token are required' },
        { status: 400 }
      )
    }

    // Create Google Calendar integration
    const integrationId = await IntegrationService.createIntegration(user.id, {
      name: name || 'Google Calendar Integration',
      type: 'GOOGLE_CALENDAR',
      config: {
        accessToken,
        refreshToken,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        calendarId: calendarId || 'primary',
      },
      isActive: true,
    })

    return NextResponse.json({ 
      integrationId,
      message: 'Google Calendar integration created successfully' 
    })
  } catch (error) {
    console.error('Google Calendar integration setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup Google Calendar integration' },
      { status: 500 }
    )
  }
}
