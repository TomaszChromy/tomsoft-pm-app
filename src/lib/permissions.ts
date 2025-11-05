/**
 * Role-based permissions system
 */

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Project management
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE_MEMBERS = 'project:manage_members',

  // Task management
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // Client management
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  // Team management
  TEAM_CREATE = 'team:create',
  TEAM_READ = 'team:read',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',
  TEAM_MANAGE_MEMBERS = 'team:manage_members',

  // Analytics and reports
  ANALYTICS_READ = 'analytics:read',
  REPORTS_CREATE = 'reports:create',
  REPORTS_READ = 'reports:read',
  REPORTS_DELETE = 'reports:delete',

  // System administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',

  // Integrations
  INTEGRATION_CREATE = 'integration:create',
  INTEGRATION_READ = 'integration:read',
  INTEGRATION_UPDATE = 'integration:update',
  INTEGRATION_DELETE = 'integration:delete',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    // All permissions
    ...Object.values(Permission),
  ],
  
  PROJECT_MANAGER: [
    // User management (limited)
    Permission.USER_READ,
    Permission.USER_UPDATE,

    // Project management (full)
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_MEMBERS,

    // Task management (full)
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,

    // Client management (full)
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,

    // Team management (limited)
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_MANAGE_MEMBERS,

    // Analytics and reports
    Permission.ANALYTICS_READ,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_READ,
    Permission.REPORTS_DELETE,

    // Integrations
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_READ,
    Permission.INTEGRATION_UPDATE,
    Permission.INTEGRATION_DELETE,
  ],

  DEVELOPER: [
    // User management (read only)
    Permission.USER_READ,

    // Project management (read only)
    Permission.PROJECT_READ,

    // Task management (full for assigned tasks)
    Permission.TASK_READ,
    Permission.TASK_UPDATE,

    // Client management (read only)
    Permission.CLIENT_READ,

    // Team management (read only)
    Permission.TEAM_READ,

    // Analytics (read only)
    Permission.ANALYTICS_READ,
    Permission.REPORTS_READ,

    // Integrations (read only)
    Permission.INTEGRATION_READ,
  ],

  CLIENT: [
    // Project management (read only for assigned projects)
    Permission.PROJECT_READ,

    // Task management (read only for assigned tasks)
    Permission.TASK_READ,

    // Client management (own data only)
    Permission.CLIENT_READ,

    // Reports (read only)
    Permission.REPORTS_READ,
  ],

  VIEWER: [
    // Basic read permissions
    Permission.PROJECT_READ,
    Permission.TASK_READ,
    Permission.CLIENT_READ,
    Permission.TEAM_READ,
    Permission.ANALYTICS_READ,
    Permission.REPORTS_READ,
  ],
}

export class PermissionService {
  /**
   * Get permissions for a user role
   */
  static getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Get permissions for a user (role + custom permissions)
   */
  static getUserPermissions(role: string, customPermissions?: string[]): Permission[] {
    const rolePermissions = this.getRolePermissions(role)
    const custom = customPermissions ? customPermissions as Permission[] : []
    
    // Combine role permissions with custom permissions
    return [...new Set([...rolePermissions, ...custom])]
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(userRole: string, permission: Permission, customPermissions?: string[]): boolean {
    const userPermissions = this.getUserPermissions(userRole, customPermissions)
    return userPermissions.includes(permission) || userPermissions.includes(Permission.SYSTEM_ADMIN)
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(userRole: string, permissions: Permission[], customPermissions?: string[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(userRole, permission, customPermissions)
    )
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(userRole: string, permissions: Permission[], customPermissions?: string[]): boolean {
    return permissions.every(permission => 
      this.hasPermission(userRole, permission, customPermissions)
    )
  }

  /**
   * Filter permissions based on user role
   */
  static filterByPermissions<T>(
    items: T[],
    userRole: string,
    getRequiredPermission: (item: T) => Permission,
    customPermissions?: string[]
  ): T[] {
    return items.filter(item => 
      this.hasPermission(userRole, getRequiredPermission(item), customPermissions)
    )
  }

  /**
   * Require specific permission (throws error if not authorized)
   */
  static requirePermission(userRole: string, permission: Permission, customPermissions?: string[]): void {
    if (!this.hasPermission(userRole, permission, customPermissions)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }

  /**
   * Require any of the specified permissions
   */
  static requireAnyPermission(userRole: string, permissions: Permission[], customPermissions?: string[]): void {
    if (!this.hasAnyPermission(userRole, permissions, customPermissions)) {
      throw new Error(`Permission denied: requires one of [${permissions.join(', ')}]`)
    }
  }

  /**
   * Get permission description for UI
   */
  static getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
      [Permission.USER_CREATE]: 'Create new users',
      [Permission.USER_READ]: 'View user information',
      [Permission.USER_UPDATE]: 'Update user information',
      [Permission.USER_DELETE]: 'Delete users',
      [Permission.USER_MANAGE_ROLES]: 'Manage user roles and permissions',

      [Permission.PROJECT_CREATE]: 'Create new projects',
      [Permission.PROJECT_READ]: 'View project information',
      [Permission.PROJECT_UPDATE]: 'Update project information',
      [Permission.PROJECT_DELETE]: 'Delete projects',
      [Permission.PROJECT_MANAGE_MEMBERS]: 'Manage project team members',

      [Permission.TASK_CREATE]: 'Create new tasks',
      [Permission.TASK_READ]: 'View task information',
      [Permission.TASK_UPDATE]: 'Update task information',
      [Permission.TASK_DELETE]: 'Delete tasks',
      [Permission.TASK_ASSIGN]: 'Assign tasks to team members',

      [Permission.CLIENT_CREATE]: 'Create new clients',
      [Permission.CLIENT_READ]: 'View client information',
      [Permission.CLIENT_UPDATE]: 'Update client information',
      [Permission.CLIENT_DELETE]: 'Delete clients',

      [Permission.TEAM_CREATE]: 'Create new teams',
      [Permission.TEAM_READ]: 'View team information',
      [Permission.TEAM_UPDATE]: 'Update team information',
      [Permission.TEAM_DELETE]: 'Delete teams',
      [Permission.TEAM_MANAGE_MEMBERS]: 'Manage team members',

      [Permission.ANALYTICS_READ]: 'View analytics and dashboards',
      [Permission.REPORTS_CREATE]: 'Create reports',
      [Permission.REPORTS_READ]: 'View reports',
      [Permission.REPORTS_DELETE]: 'Delete reports',

      [Permission.SYSTEM_ADMIN]: 'Full system administration access',
      [Permission.SYSTEM_SETTINGS]: 'Manage system settings',
      [Permission.SYSTEM_LOGS]: 'View system logs',

      [Permission.INTEGRATION_CREATE]: 'Create integrations',
      [Permission.INTEGRATION_READ]: 'View integrations',
      [Permission.INTEGRATION_UPDATE]: 'Update integrations',
      [Permission.INTEGRATION_DELETE]: 'Delete integrations',
    }

    return descriptions[permission] || permission
  }
}
