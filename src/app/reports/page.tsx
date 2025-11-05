'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Plus, Filter, BarChart3, Clock, Users, Target, FileSpreadsheet } from 'lucide-react'
import { ExportUtils, EXPORT_CONFIGS, transformDataForExport } from '@/lib/export-utils'

// Temporary inline components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
)

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4">
    {children}
  </div>
)

const Button = ({ children, onClick, variant = 'default', className = '' }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'default' | 'primary' | 'outline',
  className?: string 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

interface Report {
  id: string
  name: string
  description?: string
  type: string
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
  isPublic: boolean
}

interface Project {
  id: string
  name: string
}

interface User {
  id: string
  firstName: string
  lastName: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string>('PROJECT_SUMMARY')
  const [reportData, setReportData] = useState<any>(null)
  
  // Filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    fetchReports()
    fetchProjects()
    fetchUsers()
  }, [])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const generateReport = async () => {
    try {
      setGenerating(true)
      const token = localStorage.getItem('token')

      const filters: any = {}
      if (selectedProjects.length > 0) filters.projectIds = selectedProjects
      if (selectedUsers.length > 0) filters.userIds = selectedUsers
      if (dateFrom) filters.dateFrom = dateFrom
      if (dateTo) filters.dateTo = dateTo

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedReportType,
          filters
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        console.error('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const exportToPDF = () => {
    if (!reportData) return

    const config = EXPORT_CONFIGS[selectedReportType as keyof typeof EXPORT_CONFIGS]
    if (!config) return

    const transformedData = transformDataForExport(reportData.data, config.columns)

    ExportUtils.exportToPDF({
      title: config.title,
      subtitle: `Wygenerowano: ${new Date(reportData.generatedAt).toLocaleDateString('pl-PL')}`,
      data: transformedData,
      columns: config.columns,
      summary: getSummaryData()
    })
  }

  const exportToExcel = () => {
    if (!reportData) return

    const config = EXPORT_CONFIGS[selectedReportType as keyof typeof EXPORT_CONFIGS]
    if (!config) return

    const transformedData = transformDataForExport(reportData.data, config.columns)

    ExportUtils.exportToExcel({
      title: config.title,
      subtitle: `Wygenerowano: ${new Date(reportData.generatedAt).toLocaleDateString('pl-PL')}`,
      data: transformedData,
      columns: config.columns,
      summary: getSummaryData()
    })
  }

  const getSummaryData = () => {
    if (!reportData) return {}

    switch (selectedReportType) {
      case 'PROJECT_SUMMARY':
        return {
          'Liczba projektów': reportData.data.length,
          'Średni postęp': `${Math.round(reportData.data.reduce((sum: number, p: any) => sum + p.progress, 0) / reportData.data.length)}%`,
          'Łączne godziny': reportData.data.reduce((sum: number, p: any) => sum + p.timeTracking.totalHours, 0).toFixed(1),
          'Łączne przychody': `${reportData.data.reduce((sum: number, p: any) => sum + p.timeTracking.totalEarnings, 0).toFixed(2)} PLN`
        }
      case 'TIME_TRACKING':
        return {
          'Liczba wpisów': reportData.data.summary.totalEntries,
          'Łączne godziny': `${reportData.data.summary.totalHours.toFixed(1)}h`,
          'Godziny rozliczalne': `${reportData.data.summary.billableHours.toFixed(1)}h`,
          'Łączne przychody': `${reportData.data.summary.totalEarnings.toFixed(2)} PLN`
        }
      default:
        return {}
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_SUMMARY':
        return <BarChart3 className="w-5 h-5" />
      case 'TIME_TRACKING':
        return <Clock className="w-5 h-5" />
      case 'TEAM_PERFORMANCE':
        return <Users className="w-5 h-5" />
      case 'SPRINT_ANALYSIS':
        return <Target className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'PROJECT_SUMMARY':
        return 'Podsumowanie Projektów'
      case 'TIME_TRACKING':
        return 'Śledzenie Czasu'
      case 'TEAM_PERFORMANCE':
        return 'Wydajność Zespołu'
      case 'SPRINT_ANALYSIS':
        return 'Analiza Sprintów'
      case 'CUSTOM':
        return 'Niestandardowy'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie raportów...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
        <p className="text-gray-600 mt-2">Twórz i zarządzaj konfigurowalnymi raportami</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Generator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Generuj Nowy Raport
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ Raportu
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value="PROJECT_SUMMARY">Podsumowanie Projektów</option>
                    <option value="TIME_TRACKING">Śledzenie Czasu</option>
                    <option value="TEAM_PERFORMANCE">Wydajność Zespołu</option>
                    <option value="SPRINT_ANALYSIS">Analiza Sprintów</option>
                  </select>
                </div>

                {/* Filters */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtry
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Projects Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Projekty
                      </label>
                      <select
                        multiple
                        value={selectedProjects}
                        onChange={(e) => setSelectedProjects(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white h-24"
                      >
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Users Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Użytkownicy
                      </label>
                      <select
                        multiple
                        value={selectedUsers}
                        onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white h-24"
                      >
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date From */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Od
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Do
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="border-t pt-6">
                  <Button
                    onClick={generateReport}
                    variant="primary"
                    className="w-full"
                  >
                    {generating ? 'Generowanie...' : 'Generuj Raport'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {reportData && (
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Wyniki Raportu</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" onClick={exportToExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm overflow-auto max-h-96">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Saved Reports */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Zapisane Raporty</h2>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {getReportTypeIcon(report.type)}
                          <h3 className="font-medium ml-2">{report.name}</h3>
                        </div>
                        <Badge variant="default">
                          {getReportTypeName(report.type)}
                        </Badge>
                      </div>
                      
                      {report.description && (
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        <p>Utworzony: {formatDate(report.createdAt)}</p>
                        <p>Autor: {report.createdBy.firstName} {report.createdBy.lastName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Brak zapisanych raportów</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
