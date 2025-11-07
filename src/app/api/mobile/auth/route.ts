import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// POST /api/mobile/auth - Mobile-optimized authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, deviceInfo } = body
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        password: true,
        twoFactorEnabled: true,
        lastLogin: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // For mobile, we'll need to handle 2FA differently
      // Return a temporary token that requires 2FA completion
      const tempToken = jwt.sign(
        { userId: user.id, requires2FA: true },
        process.env.JWT_SECRET!,
        { expiresIn: '10m' }
      )

      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: 'Two-factor authentication required'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' } // Longer expiry for mobile
    )

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Log device info if provided
    if (deviceInfo) {
      await logMobileDevice(user.id, deviceInfo)
    }

    // Return user data optimized for mobile
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin
    }

    return NextResponse.json({
      success: true,
      token,
      user: userData,
      expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// POST /api/mobile/auth/2fa - Complete 2FA for mobile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tempToken, code } = body
    
    if (!tempToken || !code) {
      return NextResponse.json(
        { error: 'Temporary token and 2FA code are required' },
        { status: 400 }
      )
    }

    // Verify temporary token
    let decoded: any
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired temporary token' },
        { status: 401 }
      )
    }

    if (!decoded.requires2FA) {
      return NextResponse.json(
        { error: 'Invalid temporary token' },
        { status: 401 }
      )
    }

    // Get user with 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        twoFactorSecret: true,
        backupCodes: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify 2FA code (simplified - would use actual TOTP library)
    const isValidCode = verify2FACode(code, user.twoFactorSecret, user.backupCodes)
    
    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      )
    }

    // Generate full JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      role: user.role
    }

    return NextResponse.json({
      success: true,
      token,
      user: userData,
      expiresIn: 30 * 24 * 60 * 60,
      message: '2FA verification successful'
    })

  } catch (error) {
    console.error('Mobile 2FA error:', error)
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    )
  }
}

async function logMobileDevice(userId: string, deviceInfo: any) {
  try {
    // Log device information for security and analytics
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'mobile_login',
        details: {
          deviceInfo,
          timestamp: new Date().toISOString(),
          platform: 'mobile'
        }
      }
    })
  } catch (error) {
    console.error('Failed to log mobile device:', error)
  }
}

function verify2FACode(code: string, secret: string | null, backupCodes: string | null): boolean {
  // Simplified 2FA verification
  // In real implementation, would use libraries like 'speakeasy' for TOTP
  
  if (!secret) return false
  
  // Check if it's a backup code
  if (backupCodes) {
    try {
      const codes = JSON.parse(backupCodes)
      if (codes.includes(code)) {
        // In real implementation, would remove used backup code
        return true
      }
    } catch (error) {
      console.error('Error parsing backup codes:', error)
    }
  }
  
  // For demo purposes, accept any 6-digit code
  return /^\d{6}$/.test(code)
}
