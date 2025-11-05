'use client'

import { useState, useEffect } from 'react'
import { Shield, Users, Settings, Check, X, AlertTriangle } from 'lucide-react'

interface Permission {
  value: string
  label: string
}

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  effectivePermissions: string[]
  rolePermissions: string[]
  isActive: boolean
}

interface PermissionsData {
  permissions: Permission[]
  rolePermissions: Record<string, string[]>
}

export default function PermissionsManager() {
  const [users, setUsers] = useState<User[]>([])
  const [permissionsData, setPermissionsData] = useState<PermissionsData | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load permissions data
      const permissionsResponse = await fetch('/api/admin/permissions')
      if (!permissionsResponse.ok) {
        throw new Error('Failed to load permissions')
      }
      const permissionsData = await permissionsResponse.json()
      setPermissionsData(permissionsData)

      // Load users (assuming we have a users endpoint)
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Load data error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`)
      if (!response.ok) {
        throw new Error('Failed to load user details')
      }
      const data = await response.json()
      setSelectedUser(data.user)
    } catch (error) {
      console.error('Load user details error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load user details')
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      const data = await response.json()
      setSelectedUser(data.user)
      setSuccess('User role updated successfully')
      
      // Refresh users list
      loadData()
    } catch (error) {
      console.error('Update role error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  const updateUserPermissions = async (userId: string, permissions: string[]) => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, permissions }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update permissions')
      }

      const data = await response.json()
      setSelectedUser(data.user)
      setSuccess('User permissions updated successfully')
    } catch (error) {
      console.error('Update permissions error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (permission: string) => {
    if (!selectedUser) return

    const currentPermissions = selectedUser.permissions || []
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission]

    updateUserPermissions(selectedUser.id, newPermissions)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading permissions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Permissions Manager</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Users</h3>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUser?.id === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => loadUserDetails(user.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'PROJECT_MANAGER' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'DEVELOPER' ? 'bg-green-100 text-green-800' :
                      user.role === 'CLIENT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <p className="text-xs text-red-600 mt-1">Inactive</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">User Permissions</h3>
          </div>

          {selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h4 className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</h4>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="CLIENT">Client</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              {/* Role Permissions */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Role Permissions</h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedUser.rolePermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Permissions */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Permissions</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {permissionsData?.permissions.map((permission) => {
                    const hasPermission = selectedUser.permissions.includes(permission.value)
                    const isRolePermission = selectedUser.rolePermissions.includes(permission.value)
                    
                    return (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <button
                          onClick={() => !isRolePermission && togglePermission(permission.value)}
                          disabled={saving || isRolePermission}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            hasPermission || isRolePermission
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 hover:border-blue-500'
                          } ${isRolePermission ? 'opacity-50' : ''}`}
                        >
                          {(hasPermission || isRolePermission) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </button>
                        <span className={`text-sm ${isRolePermission ? 'text-gray-400' : 'text-gray-700'}`}>
                          {permission.label}
                          {isRolePermission && ' (from role)'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a user to manage permissions</p>
          )}
        </div>
      </div>
    </div>
  )
}
