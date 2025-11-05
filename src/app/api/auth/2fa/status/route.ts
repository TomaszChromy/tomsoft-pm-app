import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TwoFactorAuthService } from '@/lib/two-factor-auth'

// GET /api/auth/2fa/status - Get 2FA status
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const is2FAEnabled = await TwoFactorAuthService.is2FAEnabled(user.id)
    let backupCodesCount = 0

    if (is2FAEnabled) {
      backupCodesCount = await TwoFactorAuthService.getBackupCodesCount(user.id)
    }

    return NextResponse.json({
      enabled: is2FAEnabled,
      backupCodesCount,
    })
  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    )
  }
}
