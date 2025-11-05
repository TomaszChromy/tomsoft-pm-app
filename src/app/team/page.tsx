'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { useUsers, useTeamStats } from '@/hooks/use-users'
import { useAuth } from '@/contexts/auth-context'
import { CreateUserModal } from '@/components/team/create-user-modal'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function TeamPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: usersData, isLoading: usersLoading } = useUsers({
    search: searchTerm,
    role: selectedRole,
    limit: 50
  })

  const { data: teamStats, isLoading: statsLoading } = useTeamStats()

  const canManageUsers = user?.role === 'ADMIN'
  const canViewStats = ['ADMIN', 'PROJECT_MANAGER'].includes(user?.role || '')

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'PROJECT_MANAGER': return 'bg-blue-100 text-blue-800'
      case 'DEVELOPER': return 'bg-green-100 text-green-800'
      case 'CLIENT': return 'bg-purple-100 text-purple-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkloadColor = (activeTasks: number) => {
    if (activeTasks <= 3) return 'text-green-600'
    if (activeTasks <= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (usersLoading || statsLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Zespół</h1>
              <p className="text-gray-600">Zarządzaj członkami zespołu i monitoruj wydajność</p>
            </div>
            {canManageUsers && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Dodaj użytkownika
              </button>
            )}
          </div>
        </div>

        {/* Team Stats */}
        {canViewStats && teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktywni użytkownicy</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.overview.activeUsers}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">z {teamStats.overview.totalUsers} łącznie</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Godziny w tym miesiącu</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.overview.hoursThisMonth}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {teamStats.overview.timeChangeRate >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={teamStats.overview.timeChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(teamStats.overview.timeChangeRate)}%
                </span>
                <span className="text-gray-500 ml-1">vs poprzedni miesiąc</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ukończone zadania</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.overview.completedTasks}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">{teamStats.overview.completionRate}% wskaźnik ukończenia</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Przeciążeni użytkownicy</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.performance.overloadedUsers.length}</p>
                </div>
                <div className="p-3 bg-rose-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">wymagają uwagi</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Szukaj użytkowników..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Wszystkie role</option>
                <option value="ADMIN">Admin</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="DEVELOPER">Developer</option>
                <option value="CLIENT">Client</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
                >
                  Lista
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usersData?.users?.map((user: any) => (
              <div key={user.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.firstName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                {user.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
                )}

                {user.stats && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Aktywne zadania</p>
                      <p className={`text-sm font-semibold ${getWorkloadColor(user.stats.activeTasks)}`}>
                        {user.stats.activeTasks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ukończone w tym miesiącu</p>
                      <p className="text-sm font-semibold text-gray-900">{user.stats.completedTasksThisMonth}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Godziny w tym miesiącu</p>
                      <p className="text-sm font-semibold text-gray-900">{user.stats.hoursThisMonth}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Łącznie zadań</p>
                      <p className="text-sm font-semibold text-gray-900">{user.stats.totalTasks}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Użytkownik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rola
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktywne zadania
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ukończone w tym miesiącu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Godziny w tym miesiącu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersData?.users?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-indigo-600 font-semibold text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getWorkloadColor(user.stats?.activeTasks || 0)}`}>
                          {user.stats?.activeTasks || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.stats?.completedTasksThisMonth || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.stats?.hoursThisMonth || 0}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Szczegóły
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </AppLayout>
  )
}
