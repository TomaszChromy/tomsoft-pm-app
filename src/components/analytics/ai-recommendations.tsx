'use client'

import { useState, useEffect } from 'react'
// Temporary UI components - will be replaced with actual shadcn/ui components
const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>
)

const CardHeader = ({ children }: any) => (
  <div className="p-6 border-b">{children}</div>
)

const CardTitle = ({ children, className }: any) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardDescription = ({ children }: any) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
)

const CardContent = ({ children, className }: any) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const Badge = ({ children, className, variant }: any) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
    variant === 'outline' ? 'border border-gray-300 text-gray-700' : 'bg-gray-100 text-gray-800'
  } ${className}`}>
    {children}
  </span>
)

const Button = ({ children, onClick, disabled, className, variant, size }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' :
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

const Select = ({ value, onValueChange, children }: any) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </select>
)

const SelectTrigger = ({ children, className }: any) => (
  <div className={`px-3 py-2 border border-gray-300 rounded-md text-sm ${className}`}>
    {children}
  </div>
)

const SelectValue = ({ placeholder }: any) => (
  <span className="text-gray-500">{placeholder}</span>
)

const SelectContent = ({ children }: any) => (
  <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
    {children}
  </div>
)

const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
)
import { Loader2, Lightbulb, RefreshCw, Filter, Target, Users, DollarSign, Clock, Shield } from 'lucide-react'
import { AIRecommendation } from '@/lib/ai-analytics'

interface AIRecommendationsProps {
  className?: string
}

export function AIRecommendations({ className }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [filteredRecommendations, setFilteredRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics/ai-recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
      setFilteredRecommendations(data.recommendations)
      setLastUpdated(data.generatedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    let filtered = recommendations

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(rec => rec.category === categoryFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(rec => rec.priority === priorityFilter)
    }

    setFilteredRecommendations(filtered)
  }, [recommendations, categoryFilter, priorityFilter])

  const getCategoryIcon = (category: AIRecommendation['category']) => {
    switch (category) {
      case 'budget':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'timeline':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'team':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'quality':
        return <Target className="h-5 w-5 text-orange-500" />
      case 'risk':
        return <Shield className="h-5 w-5 text-red-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: AIRecommendation['category']) => {
    switch (category) {
      case 'budget':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'timeline':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'team':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'quality':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'risk':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Strategic recommendations powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating recommendations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Strategic recommendations powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Strategic recommendations powered by AI
            </CardDescription>
          </div>
          <Button onClick={fetchRecommendations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {recommendations.length === 0 
                ? "No recommendations available at the moment"
                : "No recommendations match your filters"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {recommendations.length === 0 
                ? "Add more project data to get AI-powered recommendations"
                : "Try adjusting your filters"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRecommendations.map((recommendation, index) => (
              <div
                key={index}
                className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {getCategoryIcon(recommendation.category)}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-lg">{recommendation.title}</h4>
                      <Badge className={getCategoryColor(recommendation.category)} variant="outline">
                        {recommendation.category}
                      </Badge>
                      <Badge className={getPriorityColor(recommendation.priority)} variant="outline">
                        {recommendation.priority} priority
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground">{recommendation.description}</p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Expected Impact:</h5>
                      <p className="text-sm text-blue-800">{recommendation.estimatedImpact}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Implementation Steps:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {recommendation.implementation.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                Last updated: {new Date(lastUpdated).toLocaleString()}
                {filteredRecommendations.length !== recommendations.length && (
                  <span className="ml-2">
                    • Showing {filteredRecommendations.length} of {recommendations.length} recommendations
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
