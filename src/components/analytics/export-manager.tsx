'use client'

import { useState } from 'react'
import { Download, FileText, Table, Image, Calendar, Filter, Loader2 } from 'lucide-react'

// Temporary UI components
const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>
)

const CardHeader = ({ children }: any) => (
  <div className="p-6 border-b">{children}</div>
)

const CardTitle = ({ children, className }: any) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className }: any) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled, className, variant, size }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

interface ExportManagerProps {
  className?: string
}

export function ExportManager({ className }: ExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportType, setExportType] = useState('summary')
  const [dateRange, setDateRange] = useState('30d')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeAI, setIncludeAI] = useState(true)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: exportFormat,
          type: exportType,
          dateRange,
          includeCharts,
          includeAI,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analytics-report-${Date.now()}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    {
      id: 'summary',
      name: 'Executive Summary',
      description: 'High-level overview with key metrics and insights',
      icon: FileText,
      estimatedSize: '2-3 pages'
    },
    {
      id: 'detailed',
      name: 'Detailed Report',
      description: 'Comprehensive analysis with all charts and data',
      icon: Table,
      estimatedSize: '10-15 pages'
    },
    {
      id: 'charts',
      name: 'Charts Only',
      description: 'Visual charts and graphs without detailed text',
      icon: Image,
      estimatedSize: '5-8 pages'
    },
    {
      id: 'ai-insights',
      name: 'AI Insights Report',
      description: 'AI-generated insights and recommendations only',
      icon: FileText,
      estimatedSize: '3-5 pages'
    }
  ]

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText },
    { value: 'excel', label: 'Excel Spreadsheet', icon: Table },
    { value: 'csv', label: 'CSV Data', icon: Table }
  ]

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analytics Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    exportType === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportType(option.id)}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Est. {option.estimatedSize}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Format and Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Include in Report
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Charts and Visualizations</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">AI Insights and Recommendations</span>
            </label>
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Export Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Format: {formatOptions.find(f => f.value === exportFormat)?.label}</p>
            <p>• Type: {exportOptions.find(o => o.id === exportType)?.name}</p>
            <p>• Date Range: {dateRangeOptions.find(r => r.value === dateRange)?.label}</p>
            <p>• Charts: {includeCharts ? 'Included' : 'Excluded'}</p>
            <p>• AI Insights: {includeAI ? 'Included' : 'Excluded'}</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-32"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>

        {/* Quick Export Buttons */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Quick Export</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setExportType('summary')
                setExportFormat('pdf')
                setDateRange('30d')
                handleExport()
              }}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF Summary
            </Button>
            <Button
              onClick={() => {
                setExportType('detailed')
                setExportFormat('excel')
                setDateRange('30d')
                handleExport()
              }}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              <Table className="h-4 w-4 mr-1" />
              Excel Report
            </Button>
            <Button
              onClick={() => {
                setExportType('charts')
                setExportFormat('pdf')
                setDateRange('30d')
                handleExport()
              }}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              <Image className="h-4 w-4 mr-1" />
              Charts PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
