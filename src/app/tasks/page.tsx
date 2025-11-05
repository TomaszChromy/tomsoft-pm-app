'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/app-layout'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { TaskFilters } from '@/components/kanban/task-filters'
import { CreateTaskModal } from '@/components/kanban/create-task-modal'
import { useTasks } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { Plus, Filter, Search, LayoutGrid, List } from 'lucide-react'

type ViewMode = 'kanban' | 'list'

export default function TasksPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    priority: '',
    assigneeId: '',
    search: ''
  })

  // Data fetching
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks(filters)
  const { data: projectsData, isLoading: projectsLoading } = useProjects()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="loading-spinner"></div>
        </div>
      </AppLayout>
    )
  }

  if (tasksError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Błąd ładowania zadań</h2>
            <p className="text-slate-600">Spróbuj odświeżyć stronę</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const tasks = tasksData?.tasks || []
  const projects = projectsData?.projects || []

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const canCreateTask = user?.role === 'ADMIN' || 
                       user?.role === 'PROJECT_MANAGER' || 
                       user?.role === 'DEVELOPER'

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Zadania</h1>
              <p className="text-slate-600">Zarządzaj zadaniami w projektach</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 ${viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border border-slate-200 rounded-lg ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Create Task Button */}
              {canCreateTask && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nowe zadanie
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj zadań..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <TaskFilters
              filters={filters}
              projects={projects}
              onFiltersChange={handleFilterChange}
            />
          )}
        </div>

        {/* Content */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard 
            tasks={tasks} 
            projects={projects}
            onTaskUpdate={() => {
              // Refresh tasks after update
            }}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Lista zadań</h3>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Brak zadań do wyświetlenia</p>
                {canCreateTask && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary mt-4 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Utwórz pierwsze zadanie
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'URGENT' ? 'bg-rose-500' :
                        task.priority === 'HIGH' ? 'bg-amber-500' :
                        task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <div>
                        <h4 className="font-medium text-slate-900">{task.title}</h4>
                        <p className="text-sm text-slate-500">{task.project.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'REVIEW' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {task.status === 'TODO' ? 'Do zrobienia' :
                         task.status === 'IN_PROGRESS' ? 'W trakcie' :
                         task.status === 'REVIEW' ? 'Do sprawdzenia' : 'Ukończone'}
                      </span>
                      {task.assignee && (
                        <span className="text-sm text-slate-600">
                          {task.assignee.firstName} {task.assignee.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <CreateTaskModal
            projects={projects}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              // Tasks will be refreshed automatically via React Query
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
