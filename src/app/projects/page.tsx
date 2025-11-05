'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { useAuth } from '@/contexts/auth-context'
import { useQuery } from 'react-query'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  progress: number
  budget?: number
  spent?: number
  startDate?: string
  endDate?: string
  deadline?: string
  owner: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  client?: {
    id: string
    name: string
  }
  members: Array<{
    user: {
      id: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }>
  _count: {
    tasks: number
    members: number
  }
}

async function fetchProjects(): Promise<{ projects: Project[] }> {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/projects', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  return response.json()
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data, isLoading, error } = useQuery(
    ['projects'],
    fetchProjects,
    {
      enabled: !!user
    }
  )

  const projects = data?.projects || []

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canCreateProject = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER'

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Błąd ładowania projektów</h3>
            <p className="text-gray-500">Spróbuj odświeżyć stronę</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projekty</h1>
            <p className="text-slate-600 mt-1">
              Zarządzaj swoimi projektami i śledź postępy
            </p>
          </div>
          {canCreateProject && (
            <Link
              href="/projects/new"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nowy projekt
            </Link>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj projektów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="PLANNING">Planowanie</option>
                <option value="ACTIVE">Aktywne</option>
                <option value="ON_HOLD">Wstrzymane</option>
                <option value="COMPLETED">Ukończone</option>
                <option value="CANCELLED">Anulowane</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Wszystkie priorytety</option>
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Średni</option>
                <option value="HIGH">Wysoki</option>
                <option value="URGENT">Pilny</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak projektów</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Nie znaleziono projektów spełniających kryteria wyszukiwania.'
                : 'Rozpocznij od utworzenia swojego pierwszego projektu.'
              }
            </p>
            {canCreateProject && !searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Utwórz pierwszy projekt
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// ProjectCard Component
function ProjectCard({ project, viewMode }: { project: Project; viewMode: 'grid' | 'list' }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  if (viewMode === 'list') {
    return (
      <Link href={`/projects/${project.id}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{project._count.members} członków</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{project._count.tasks} zadań</span>
                </div>
                {project.deadline && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Termin: {formatDate(project.deadline)}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center gap-1">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    <span>Budżet: {project.budget.toString()} PLN</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 mb-1">{project.progress}%</div>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{project.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 mb-1">{project.progress}%</div>
          </div>
        </div>

        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
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

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{project._count.members}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{project._count.tasks} zadań</span>
            </div>
          </div>
          {project.deadline && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(project.deadline)}</span>
            </div>
          )}
        </div>

        {project.client && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Klient: <span className="font-medium">{project.client.name}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
