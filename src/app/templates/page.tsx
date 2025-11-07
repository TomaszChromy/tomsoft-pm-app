'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  StarIcon,
  UsersIcon,
  ClockIcon,
  CheckSquareIcon,
  FolderIcon,
  EyeIcon,
  CopyIcon
} from 'lucide-react'

// Temporary UI components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

interface Template {
  id: string
  name: string
  description?: string
  category: string
  tags: string[]
  isPublic: boolean
  defaultDuration?: number
  estimatedHours?: number
  complexity?: string
  usageCount: number
  rating?: number
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  counts: {
    phases: number
    tasks: number
    milestones: number
  }
  createdAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadTemplates()
  }, [searchTerm, selectedCategory, showPublicOnly, page])

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (showPublicOnly) params.append('public', 'true')
      params.append('page', page.toString())

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/templates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data.templates)
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    // Navigate to project creation with template
    window.location.href = `/projects/new?template=${templateId}`
  }

  const handleViewTemplate = (templateId: string) => {
    window.location.href = `/templates/${templateId}`
  }

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'LOW': return 'success'
      case 'MEDIUM': return 'warning'
      case 'HIGH': return 'error'
      case 'EXPERT': return 'error'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Templates</h1>
          <p className="text-gray-600">
            Start your projects faster with pre-built templates
          </p>
        </div>
        
        <Button onClick={() => window.location.href = '/templates/new'}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.name} value={category.name}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>

          {/* Public Only Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Public only</span>
          </label>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600">{template.category}</p>
              </div>
              
              {template.isPublic && (
                <Badge variant="success">Public</Badge>
              )}
            </div>

            {/* Description */}
            {template.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {template.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="flex items-center justify-center text-blue-600 mb-1">
                  <FolderIcon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {template.counts.phases}
                </div>
                <div className="text-xs text-gray-600">Phases</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center text-green-600 mb-1">
                  <CheckSquareIcon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {template.counts.tasks}
                </div>
                <div className="text-xs text-gray-600">Tasks</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center text-purple-600 mb-1">
                  <ClockIcon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {template.estimatedHours ? `${template.estimatedHours}h` : '-'}
                </div>
                <div className="text-xs text-gray-600">Hours</div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {template.complexity && (
                  <Badge variant={getComplexityColor(template.complexity)}>
                    {template.complexity}
                  </Badge>
                )}
                
                {template.rating && (
                  <div className="flex items-center text-yellow-500">
                    <StarIcon className="h-3 w-3 fill-current" />
                    <span className="text-xs text-gray-600 ml-1">
                      {template.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <UsersIcon className="h-3 w-3 mr-1" />
                {template.usageCount} uses
              </div>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewTemplate(template.id)}
                className="flex-1"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                View
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleApplyTemplate(template.id)}
                className="flex-1"
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                Use Template
              </Button>
            </div>

            {/* Creator */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-5 h-5 bg-gray-300 rounded-full mr-2" />
                <span>
                  by {template.createdBy.firstName} {template.createdBy.lastName}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search criteria'
              : 'Create your first project template to get started'
            }
          </p>
          <Button onClick={() => window.location.href = '/templates/new'}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  )
}
