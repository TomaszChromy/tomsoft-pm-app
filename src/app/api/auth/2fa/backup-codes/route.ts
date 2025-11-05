import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TwoFactorAuthService } from '@/lib/two-factor-auth'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/auth/2fa/backup-codes - Get backup codes count
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Check if 2FA is enabled
    const is2FAEnabled = await TwoFactorAuthService.is2FAEnabled(user.id)
    if (!is2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    const count = await TwoFactorAuthService.getBackupCodesCount(user.id)

    return NextResponse.json({
      count,
    })
  } catch (error) {
    console.error('Get backup codes count error:', error)
    return NextResponse.json(
      { error: 'Failed to get backup codes count' },
      { status: 500 }
    )
  }
}

// POST /api/auth/2fa/backup-codes - Regenerate backup codes
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { password, token } = body

    if (!password || !token) {
      return NextResponse.json(
        { error: 'Password and 2FA token are required' },
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

    // Get user with password for verification
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!userWithPassword) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, userWithPassword.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Verify 2FA token
    const tokenResult = await TwoFactorAuthService.verifyToken(user.id, token)
    if (!tokenResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid 2FA token' },
        { status: 400 }
      )
    }

    // Regenerate backup codes
    const newBackupCodes = await TwoFactorAuthService.regenerateBackupCodes(user.id)

    return NextResponse.json({
      message: 'Backup codes regenerated successfully',
      backupCodes: newBackupCodes,
    })
  } catch (error) {
    console.error('Regenerate backup codes error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    )
  }
}
