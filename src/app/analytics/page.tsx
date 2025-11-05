'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { ProjectProgressChart } from '@/components/analytics/project-progress-chart'
import { TeamPerformanceChart } from '@/components/analytics/team-performance-chart'
import { TimeTrackingChart } from '@/components/analytics/time-tracking-chart'
import { BudgetAnalysisChart } from '@/components/analytics/budget-analysis-chart'
import { TaskStatusChart } from '@/components/analytics/task-status-chart'
import { ExportReports } from '@/components/analytics/export-reports'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import { useAnalytics } from '@/hooks/use-analytics'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Download,
  Calendar,
  Filter
} from 'lucide-react'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  })
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])

  const { 
    data: analyticsData, 
    isLoading,
    error 
  } = useAnalytics({
    dateRange,
    projectIds: selectedProjects,
    userIds: selectedTeamMembers
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
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
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Błąd ładowania danych analitycznych
            </h2>
            <p className="text-gray-600">
              Nie udało się załadować danych. Spróbuj ponownie później.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const stats = analyticsData?.overview || {
    totalProjects: 0,
    completedTasks: 0,
    totalHours: 0,
    budgetUtilization: 0
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analityka i Raporty
            </h1>
            <p className="text-gray-600">
              Szczegółowe analizy wydajności projektów i zespołu
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <ExportReports 
              data={analyticsData}
              dateRange={dateRange}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtry</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projekty
              </label>
              <select
                multiple
                value={selectedProjects}
                onChange={(e) => setSelectedProjects(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {analyticsData?.projects?.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Członkowie zespołu
              </label>
              <select
                multiple
                value={selectedTeamMembers}
                onChange={(e) => setSelectedTeamMembers(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {analyticsData?.teamMembers?.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projekty</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ukończone zadania</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przepracowane godziny</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHours}h</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wykorzystanie budżetu</p>
                <p className="text-2xl font-bold text-gray-900">{stats.budgetUtilization}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Postęp projektów
            </h3>
            <ProjectProgressChart data={analyticsData?.projectProgress || []} />
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status zadań
            </h3>
            <TaskStatusChart data={analyticsData?.taskStatus || []} />
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Wydajność zespołu
            </h3>
            <TeamPerformanceChart data={analyticsData?.teamPerformance || []} />
          </div>

          {/* Time Tracking */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Śledzenie czasu
            </h3>
            <TimeTrackingChart data={analyticsData?.timeTracking || []} />
          </div>
        </div>

        {/* Budget Analysis - Full Width */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analiza budżetu
          </h3>
          <BudgetAnalysisChart data={analyticsData?.budgetAnalysis || []} />
        </div>
      </div>
    </AppLayout>
  )
}
