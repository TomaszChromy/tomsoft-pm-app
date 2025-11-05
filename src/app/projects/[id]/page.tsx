'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings,
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  startDate?: string
  endDate?: string
  budget?: number
  progress?: number
  clientId?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
  }
  client?: {
    id: string
    name: string
    email: string
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    assigneeId?: string
    assignee?: {
      id: string
      name: string
    }
  }>
  _count: {
    tasks: number
    members: number
  }
}

export default function ProjectDetailsPage() {
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login')
      return
    }

    fetchProject()
  }, [isAuthenticated, token, projectId])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Projekt nie został znaleziony')
        }
        if (response.status === 403) {
          throw new Error('Brak uprawnień do tego projektu')
        }
        throw new Error('Błąd podczas ładowania projektu')
      }

      const data = await response.json()
      setProject(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Błąd</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Link href="/projects" className="btn-primary">
            Powrót do projektów
          </Link>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Circle className="w-4 h-4 text-emerald-500" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'ON_HOLD': return <Clock className="w-4 h-4 text-amber-500" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4 text-rose-500" />
      default: return <Circle className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'ON_HOLD': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-100 text-rose-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800'
      case 'LOW': return 'bg-slate-100 text-slate-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || project.ownerId === user?.id

  const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
  const totalTasks = project.tasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="p-2 text-slate-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <p className="text-slate-600">Szczegóły projektu</p>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edytuj
                </Link>
                <Link
                  href={`/projects/${project.id}/tasks`}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Zadania
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(project.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">{project.name}</h2>
                  {project.description && (
                    <p className="text-slate-600">{project.description}</p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Postęp projektu</span>
                  <span className="text-sm font-medium text-slate-900">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                  <span>{completedTasks} z {totalTasks} zadań ukończonych</span>
                  <span>{totalTasks - completedTasks} pozostało</span>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Właściciel projektu</p>
                      <p className="font-medium text-slate-900">{project.owner.name}</p>
                    </div>
                  </div>
                  
                  {project.client && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Klient</p>
                        <p className="font-medium text-slate-900">{project.client.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {project.startDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Data rozpoczęcia</p>
                        <p className="font-medium text-slate-900">
                          {new Date(project.startDate).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {project.endDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Deadline</p>
                        <p className="font-medium text-slate-900">
                          {new Date(project.endDate).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {project.budget && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Budżet</p>
                        <p className="font-medium text-slate-900">
                          {project.budget.toLocaleString('pl-PL')} PLN
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Ostatnie zadania</h3>
                <Link
                  href={`/projects/${project.id}/tasks`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Zobacz wszystkie
                </Link>
              </div>

              {project.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Brak zadań w tym projekcie</p>
                  {canEdit && (
                    <Link
                      href={`/projects/${project.id}/tasks/new`}
                      className="btn-primary mt-4 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Dodaj pierwsze zadanie
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {project.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'DONE' ? 'bg-emerald-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                          'bg-slate-300'
                        }`} />
                        <div>
                          <p className="font-medium text-slate-900">{task.title}</p>
                          {task.assignee && (
                            <p className="text-sm text-slate-500">Przypisane: {task.assignee.name}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Zespół</h3>
                {canEdit && (
                  <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{member.user.name}</p>
                      <p className="text-sm text-slate-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Statystyki</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Wszystkie zadania</span>
                  <span className="font-medium text-slate-900">{project._count.tasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Członkowie zespołu</span>
                  <span className="font-medium text-slate-900">{project._count.members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ukończone zadania</span>
                  <span className="font-medium text-slate-900">{completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Postęp</span>
                  <span className="font-medium text-slate-900">{progressPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
