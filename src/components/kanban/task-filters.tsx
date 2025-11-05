'use client'

import { X } from 'lucide-react'

interface TaskFiltersProps {
  filters: {
    projectId: string
    status: string
    priority: string
    assigneeId: string
    search: string
  }
  projects: any[]
  onFiltersChange: (filters: any) => void
}

export function TaskFilters({ filters, projects, onFiltersChange }: TaskFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      projectId: '',
      status: '',
      priority: '',
      assigneeId: '',
      search: filters.search // Keep search
    })
  }

  const hasActiveFilters = filters.projectId || filters.status || filters.priority || filters.assigneeId

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-900">Filtry</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Projekt
          </label>
          <select
            value={filters.projectId}
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Wszystkie projekty</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Wszystkie statusy</option>
            <option value="TODO">Do zrobienia</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="REVIEW">Do sprawdzenia</option>
            <option value="DONE">Ukończone</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Priorytet
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Wszystkie priorytety</option>
            <option value="LOW">Niski</option>
            <option value="MEDIUM">Średni</option>
            <option value="HIGH">Wysoki</option>
            <option value="URGENT">Pilny</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Przypisane do
          </label>
          <select
            value={filters.assigneeId}
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Wszyscy użytkownicy</option>
            <option value="unassigned">Nieprzypisane</option>
            {/* TODO: Add team members options */}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {filters.projectId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                Projekt: {projects.find(p => p.id === filters.projectId)?.name || 'Unknown'}
                <button
                  type="button"
                  onClick={() => handleFilterChange('projectId', '')}
                  className="hover:bg-indigo-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Status: {
                  filters.status === 'TODO' ? 'Do zrobienia' :
                  filters.status === 'IN_PROGRESS' ? 'W trakcie' :
                  filters.status === 'REVIEW' ? 'Do sprawdzenia' :
                  filters.status === 'DONE' ? 'Ukończone' : filters.status
                }
                <button
                  type="button"
                  onClick={() => handleFilterChange('status', '')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.priority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                Priorytet: {
                  filters.priority === 'LOW' ? 'Niski' :
                  filters.priority === 'MEDIUM' ? 'Średni' :
                  filters.priority === 'HIGH' ? 'Wysoki' :
                  filters.priority === 'URGENT' ? 'Pilny' : filters.priority
                }
                <button
                  type="button"
                  onClick={() => handleFilterChange('priority', '')}
                  className="hover:bg-amber-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.assigneeId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                Przypisane: {filters.assigneeId === 'unassigned' ? 'Nieprzypisane' : 'Użytkownik'}
                <button
                  type="button"
                  onClick={() => handleFilterChange('assigneeId', '')}
                  className="hover:bg-emerald-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
