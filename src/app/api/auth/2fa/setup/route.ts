import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TwoFactorAuthService } from '@/lib/two-factor-auth'

// GET /api/auth/2fa/setup - Generate 2FA setup data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Check if 2FA is already enabled
    const is2FAEnabled = await TwoFactorAuthService.is2FAEnabled(user.id)
    if (is2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      )
    }

    // Generate setup data
    const setupData = await TwoFactorAuthService.generateSetup(user.id, user.email)

    return NextResponse.json({
      secret: setupData.secret,
      qrCodeUrl: setupData.qrCodeUrl,
      backupCodes: setupData.backupCodes,
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to generate 2FA setup' },
      { status: 500 }
    )
  }
}

// POST /api/auth/2fa/setup - Enable 2FA with verification
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { secret, token, backupCodes } = body

    if (!secret || !token || !backupCodes) {
      return NextResponse.json(
        { error: 'Secret, token, and backup codes are required' },
        { status: 400 }
      )
    }

    // Check if 2FA is already enabled
    const is2FAEnabled = await TwoFactorAuthService.is2FAEnabled(user.id)
    if (is2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      )
    }

    // Enable 2FA
    const success = await TwoFactorAuthService.enable2FA(user.id, secret, token, backupCodes)

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '2FA has been successfully enabled',
      enabled: true,
    })
  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    )
  }
}
