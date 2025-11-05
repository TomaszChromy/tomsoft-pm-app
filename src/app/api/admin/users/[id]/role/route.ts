import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { Permission, PermissionService } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']),
})

/**
 * GET /api/admin/users/[id]/role
 * Get user role and permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(Permission.USER_READ)(request)

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const customPermissions = user.permissions ? JSON.parse(user.permissions) : []
    const effectivePermissions = PermissionService.getUserPermissions(user.role, customPermissions)

    return NextResponse.json({
      user: {
        ...user,
        permissions: customPermissions,
        effectivePermissions,
        rolePermissions: PermissionService.getRolePermissions(user.role),
      },
    })
  } catch (error) {
    console.error('Get user role error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get user role' },
      { status: error instanceof Error && error.message.includes('Permission denied') ? 403 : 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[id]/role
 * Update user role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(Permission.USER_MANAGE_ROLES)(request)

    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: validatedData.role,
        // Clear custom permissions when role changes
        permissions: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    })

    const effectivePermissions = PermissionService.getUserPermissions(updatedUser.role, [])

    return NextResponse.json({
      message: 'User role updated successfully',
      user: {
        ...updatedUser,
        permissions: [],
        effectivePermissions,
        rolePermissions: PermissionService.getRolePermissions(updatedUser.role),
      },
    })
  } catch (error) {
    console.error('Update user role error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user role' },
      { status: error instanceof Error && error.message.includes('Permission denied') ? 403 : 500 }
    )
  }
}
