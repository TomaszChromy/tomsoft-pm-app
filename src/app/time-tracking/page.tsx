'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTimer, useTimeTracking } from '@/hooks/use-timer'
import { TimerWidget } from '@/components/timer-widget'
import { AppLayout } from '@/components/app-layout'
import { ClockIcon, CalendarIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

// Temporary UI components
const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>
)

const CardHeader = ({ children }: any) => (
  <div className="p-4 border-b">{children}</div>
)

const CardTitle = ({ children }: any) => (
  <h3 className="text-lg font-semibold">{children}</h3>
)

const CardContent = ({ children, className }: any) => (
  <div className={`p-4 ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled, className, variant }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`px-4 py-2 rounded ${variant === 'outline' ? 'border border-gray-300' : 'bg-blue-600 text-white'} ${className}`}
  >
    {children}
  </button>
)

const Input = ({ value, onChange, placeholder, type, className }: any) => (
  <input 
    type={type || 'text'}
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    className={`px-3 py-2 border rounded ${className}`}
  />
)

const Badge = ({ children, variant }: any) => (
  <span className={`px-2 py-1 text-xs rounded ${variant === 'outline' ? 'border' : 'bg-gray-200'}`}>
    {children}
  </span>
)

export default function TimeTrackingPage() {
  const { user } = useAuth()
  const { timeEntries, summary, isLoading, fetchTimeEntries, deleteTimeEntry } = useTimeTracking()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [filters, setFilters] = useState({
    projectId: '',
    from: '',
    to: '',
    isRunning: undefined as boolean | undefined
  })

  // Fetch projects and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          fetch('/api/projects', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ])

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.projects || [])
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Fetch time entries
  useEffect(() => {
    fetchTimeEntries(filters)
  }, [filters])

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      await deleteTimeEntry(id)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Śledź czas pracy nad projektami i zadaniami</p>
        </div>

        {/* Timer Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TimerWidget projects={projects} tasks={tasks} />
          </div>

          {/* Summary Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Łączny czas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? formatTime(summary.totalHours) : '0h 0m'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Billable</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? formatTime(summary.billableHours) : '0h 0m'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Zarobki</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? `${summary.totalEarnings.toFixed(2)} PLN` : '0 PLN'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Projekt</label>
                <select
                  value={filters.projectId}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Wszystkie projekty</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Od</label>
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e: any) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Do</label>
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e: any) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.isRunning === undefined ? '' : filters.isRunning.toString()}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    isRunning: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Wszystkie</option>
                  <option value="true">Aktywne</option>
                  <option value="false">Zakończone</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card>
          <CardHeader>
            <CardTitle>Historia czasu pracy</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Ładowanie...</p>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Brak wpisów czasu pracy
              </div>
            ) : (
              <div className="space-y-4">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{entry.project.name}</h4>
                          {entry.task && (
                            <span className="text-gray-500">• {entry.task.title}</span>
                          )}
                          {entry.isRunning && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Aktywny
                            </Badge>
                          )}
                          {entry.billable && (
                            <Badge variant="outline">Billable</Badge>
                          )}
                        </div>
                        
                        {entry.description && (
                          <p className="text-gray-600 text-sm mb-2">{entry.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatDate(entry.date)}</span>
                          <span>{formatTime(Number(entry.hours))}</span>
                          {entry.hourlyRate && (
                            <span>{entry.hourlyRate} PLN/h</span>
                          )}
                        </div>

                        {entry.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {entry.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Usuń
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
