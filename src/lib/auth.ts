import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { Permission, PermissionService } from './permissions'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  }

  static async getUserFromToken(token: string) {
    try {
      const payload = this.verifyToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
        }
      })
      return user
    } catch (error) {
      return null
    }
  }

  static getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return null
  }

  static async authenticateRequest(request: NextRequest) {
    const token = this.getTokenFromRequest(request)
    if (!token) {
      return null
    }
    return this.getUserFromToken(token)
  }
}

/**
 * Middleware function to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const user = await AuthService.authenticateRequest(request)
  if (!user || !user.isActive) {
    throw new Error('Unauthorized')
  }
  return user
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request)
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Forbidden')
    }
    return user
  }
}

/**
 * Middleware function to require specific permission
 */
export function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request)
    const customPermissions = user.permissions ? JSON.parse(user.permissions) : []

    PermissionService.requirePermission(user.role, permission, customPermissions)
    return user
  }
}

/**
 * Middleware function to require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request)
    const customPermissions = user.permissions ? JSON.parse(user.permissions) : []

    PermissionService.requireAnyPermission(user.role, permissions, customPermissions)
    return user
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: any, permission: Permission): boolean {
  const customPermissions = user.permissions ? JSON.parse(user.permissions) : []
  return PermissionService.hasPermission(user.role, permission, customPermissions)
}
