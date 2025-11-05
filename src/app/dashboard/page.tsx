'use client'

import { BarChart3, Users, CheckCircle, TrendingUp, Plus, Calendar, Clock, DollarSign, FolderOpen } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProjects } from '@/hooks/use-projects'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const router = useRouter()

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

  const projects = projectsData?.projects || []
  const recentProjects = projects.slice(0, 5)

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Witaj, {user?.firstName || user?.email}! 👋
          </h1>
          <p className="text-slate-500 font-medium">
            {new Date().toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {statsLoading ? '...' : stats?.activeProjects || 0}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Aktywne projekty</h3>
            <p className="text-sm text-slate-500">W trakcie realizacji</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {statsLoading ? '...' : stats?.teamMembers || 0}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Członkowie zespołu</h3>
            <p className="text-sm text-slate-500">Aktywni użytkownicy</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {statsLoading ? '...' : stats?.completedTasks || 0}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Ukończone zadania</h3>
            <p className="text-sm text-slate-500">W tym miesiącu</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-rose-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {statsLoading ? '...' : `${stats?.overallProgress || 0}%`}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Ogólny postęp</h3>
            <p className="text-sm text-slate-500">Wszystkie projekty</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Ostatnie projekty</h3>
            <Link href="/projects/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nowy projekt
            </Link>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Brak projektów</p>
              <Link href="/projects/new" className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Utwórz pierwszy projekt
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project: any) => (
                <Link 
                  key={project.id} 
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{project.name}</h4>
                      <p className="text-sm text-slate-500">{project.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{project.progress || 0}%</p>
                      <p className="text-xs text-slate-500">{project._count?.tasks || 0} zadań</p>
                    </div>
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
