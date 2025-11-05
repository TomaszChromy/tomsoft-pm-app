import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TwoFactorAuthService } from '@/lib/two-factor-auth'

// POST /api/auth/2fa/verify - Verify 2FA token
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if 2FA is enabled
    const is2FAEnabled = await TwoFactorAuthService.is2FAEnabled(user.id)
    if (!is2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Verify token
    const result = await TwoFactorAuthService.verifyToken(user.id, token)

    if (!result.isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Token verified successfully',
      isBackupCode: result.isBackupCode || false,
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    )
  }
}
