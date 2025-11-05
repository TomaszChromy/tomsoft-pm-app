'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { useAuth } from '@/contexts/auth-context'
import { useProjects } from '@/hooks/use-projects'
import { useTasks } from '@/hooks/use-tasks'
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Activity,
  Star
} from 'lucide-react'

export default function ClientPortalPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch client's projects
  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    clientId: user?.id,
    limit: 50
  })

  // Fetch client's tasks (from their projects)
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    clientId: user?.id,
    limit: 50
  })

  if (user?.role !== 'CLIENT') {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dostęp zabroniony</h1>
            <p className="text-gray-600">Ten portal jest dostępny tylko dla klientów.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (projectsLoading || tasksLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const projects = projectsData?.projects || []
  const tasks = tasksData?.tasks || []

  // Calculate statistics
  const activeProjects = projects.filter(p => ['PLANNING', 'IN_PROGRESS'].includes(p.status)).length
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'DONE').length
  const pendingTasks = tasks.filter(t => ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(t.status)).length
  const overdueTasks = tasks.filter(t => 
    ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(t.status) && 
    t.dueDate && 
    new Date(t.dueDate) < new Date()
  ).length

  // Calculate total budget and spent (mock data for now)
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'REVIEW': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portal Klienta</h1>
          <p className="text-gray-600">Witaj, {user?.firstName}! Oto przegląd Twoich projektów i zadań.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywne projekty</p>
                <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {completedProjects} ukończonych
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oczekujące zadania</p>
                <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {completedTasks} ukończonych
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przeterminowane</p>
                <p className="text-2xl font-bold text-gray-900">{overdueTasks}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-red-600">
              wymagają uwagi
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budżet wykorzystany</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              ${totalSpent.toLocaleString()} z ${totalBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Przegląd projektów
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Moje zadania
              </button>
              <button
                onClick={() => setActiveTab('communication')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'communication'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Komunikacja
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'billing'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Faktury i budżet
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Twoje projekty</h3>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => (
                      <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                                {project.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Postęp</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Data rozpoczęcia</p>
                            <p className="font-medium">{new Date(project.startDate).toLocaleDateString('pl-PL')}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Termin</p>
                            <p className="font-medium">{new Date(project.endDate).toLocaleDateString('pl-PL')}</p>
                          </div>
                        </div>

                        {project.budget && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Budżet</span>
                              <span className="font-medium">${project.budget.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Brak projektów</h3>
                    <p className="text-gray-500">Nie masz jeszcze żadnych projektów.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Zadania wymagające uwagi</h3>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks
                      .filter(task => ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status))
                      .map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500">{task.project.name}</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {task.assignee && (
                                <div className="text-xs text-gray-500">
                                  {task.assignee.firstName} {task.assignee.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zadań</h3>
                    <p className="text-gray-500">Wszystkie zadania zostały ukończone!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'communication' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Komunikacja z zespołem</h3>
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Wkrótce dostępne</h3>
                  <p className="text-gray-500">System komunikacji będzie dostępny wkrótce.</p>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Faktury i budżet</h3>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Wkrótce dostępne</h3>
                  <p className="text-gray-500">System fakturowania będzie dostępny wkrótce.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
