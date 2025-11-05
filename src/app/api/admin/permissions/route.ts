import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { Permission, PermissionService } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePermissionsSchema = z.object({
  userId: z.string(),
  permissions: z.array(z.string()),
})

/**
 * GET /api/admin/permissions
 * Get all available permissions and role definitions
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(Permission.USER_MANAGE_ROLES)(request)

    const permissions = Object.values(Permission).map(permission => ({
      value: permission,
      label: PermissionService.getPermissionDescription(permission),
    }))

    const roles = Object.keys(PermissionService.getRolePermissions('ADMIN')).map(role => ({
      value: role,
      permissions: PermissionService.getRolePermissions(role),
    }))

    return NextResponse.json({
      permissions,
      roles,
      rolePermissions: {
        ADMIN: PermissionService.getRolePermissions('ADMIN'),
        PROJECT_MANAGER: PermissionService.getRolePermissions('PROJECT_MANAGER'),
        DEVELOPER: PermissionService.getRolePermissions('DEVELOPER'),
        CLIENT: PermissionService.getRolePermissions('CLIENT'),
        VIEWER: PermissionService.getRolePermissions('VIEWER'),
      },
    })
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get permissions' },
      { status: error instanceof Error && error.message.includes('Permission denied') ? 403 : 500 }
    )
  }
}

/**
 * POST /api/admin/permissions
 * Update user permissions
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(Permission.USER_MANAGE_ROLES)(request)

    const body = await request.json()
    const validatedData = updatePermissionsSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, email: true, role: true, permissions: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate permissions
    const validPermissions = Object.values(Permission)
    const invalidPermissions = validatedData.permissions.filter(
      permission => !validPermissions.includes(permission as Permission)
    )

    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      )
    }

    // Update user permissions
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        permissions: JSON.stringify(validatedData.permissions),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
      },
    })

    return NextResponse.json({
      message: 'Permissions updated successfully',
      user: {
        ...updatedUser,
        permissions: updatedUser.permissions ? JSON.parse(updatedUser.permissions) : [],
        effectivePermissions: PermissionService.getUserPermissions(
          updatedUser.role,
          updatedUser.permissions ? JSON.parse(updatedUser.permissions) : []
        ),
      },
    })
  } catch (error) {
    console.error('Update permissions error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update permissions' },
      { status: error instanceof Error && error.message.includes('Permission denied') ? 403 : 500 }
    )
  }
}
