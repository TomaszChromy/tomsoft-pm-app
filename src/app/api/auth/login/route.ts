import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { TwoFactorAuthService } from '@/lib/two-factor-auth'
import { createRateLimit, RATE_LIMITS, getClientIdentifier, addRateLimitHeaders } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitCheck = createRateLimit(RATE_LIMITS.AUTH_LOGIN)(request)
  if (rateLimitCheck) {
    return rateLimitCheck
  }

  try {
    const body = await request.json()
    console.log('Login attempt for:', body.email)
    console.log('Request body:', JSON.stringify(body, null, 2))

    if (!body.email || !body.password) {
      console.log('Missing email or password in request')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
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
      }
    })

    if (!user) {
      console.log('User not found for email:', validatedData.email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
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
    console.log('Comparing password for user:', user.email)
    const isValidPassword = await AuthService.comparePassword(
      validatedData.password,
      user.password
    )
    console.log('Password valid:', isValidPassword)

    if (!isValidPassword) {
      console.log('Invalid password for user:', user.email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Check if 2FA token is provided
      const twoFactorToken = validatedData.twoFactorToken

      if (!twoFactorToken) {
        return NextResponse.json({
          requires2FA: true,
          message: '2FA token required',
        }, { status: 200 })
      }

      // Verify 2FA token
      const tokenResult = await TwoFactorAuthService.verifyToken(user.id, twoFactorToken)
      if (!tokenResult.isValid) {
        return NextResponse.json(
          { error: 'Invalid 2FA token' },
          { status: 401 }
        )
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Remove password and sensitive fields from response
    const { password, twoFactorEnabled, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    })

  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
