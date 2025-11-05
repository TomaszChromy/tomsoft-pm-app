'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { useUser } from '@/hooks/use-users'
import { useAuth } from '@/contexts/auth-context'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Edit,
  Settings,
  Activity,
  BarChart3,
  FolderOpen,
  ListTodo
} from 'lucide-react'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: userData, isLoading } = useUser(userId)

  const canEdit = currentUser?.id === userId || currentUser?.role === 'ADMIN'

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!userData?.user) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Użytkownik nie znaleziony</h1>
            <p className="text-gray-600">Nie można znaleźć użytkownika o podanym ID.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const user = userData.user

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'DONE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.firstName} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-indigo-600 font-bold text-xl">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                <p className="text-gray-600">@{user.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                  </span>
                </div>
              </div>
            </div>
            {canEdit && (
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edytuj profil
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informacje kontaktowe</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Dołączył {new Date(user.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Ostatnio aktywny {new Date(user.lastLoginAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {user.bio && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">O mnie</h3>
                <p className="text-sm text-gray-600">{user.bio}</p>
              </div>
            )}

            {user.skills && user.skills.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Umiejętności</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.hourlyRate && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stawka godzinowa</h3>
                <p className="text-2xl font-bold text-indigo-600">${user.hourlyRate}/h</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="lg:col-span-2">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aktywne zadania</p>
                    <p className="text-2xl font-bold text-gray-900">{user.stats.activeTasks}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ListTodo className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                {user.stats.overdueTasks > 0 && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {user.stats.overdueTasks} przeterminowane
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ukończone w tym miesiącu</p>
                    <p className="text-2xl font-bold text-gray-900">{user.stats.completedTasksThisMonth}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {user.stats.taskCompletionRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={user.stats.taskCompletionRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(user.stats.taskCompletionRate)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs poprzedni miesiąc</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Godziny w tym miesiącu</p>
                    <p className="text-2xl font-bold text-gray-900">{user.stats.hoursThisMonth}h</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {user.stats.hoursChangeRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={user.stats.hoursChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(user.stats.hoursChangeRate)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs poprzedni miesiąc</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projekty</p>
                    <p className="text-2xl font-bold text-gray-900">{user.stats.totalProjects}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  jako właściciel
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'tasks'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Ostatnie zadania
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'projects'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Projekty
                  </button>
                  <button
                    onClick={() => setActiveTab('time')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'time'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Czas pracy
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    {user.recentTasks?.length > 0 ? (
                      user.recentTasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-500">{task.project.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Brak ostatnich zadań</p>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    {user.ownedProjects?.length > 0 ? (
                      user.ownedProjects.map((project: any) => (
                        <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                                {project.priority}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{project.progress}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Brak projektów</p>
                    )}
                  </div>
                )}

                {activeTab === 'time' && (
                  <div className="space-y-4">
                    {user.recentTimeEntries?.length > 0 ? (
                      user.recentTimeEntries.map((entry: any) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{entry.task.title}</h4>
                            {entry.description && (
                              <p className="text-sm text-gray-500">{entry.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(entry.createdAt).toLocaleDateString('pl-PL')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-indigo-600">{entry.hours}h</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Brak wpisów czasu pracy</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
