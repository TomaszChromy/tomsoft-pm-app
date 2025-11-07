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
import { Loader2, Brain, AlertTriangle, CheckCircle, Info, TrendingUp, RefreshCw } from 'lucide-react'
import { AIInsight } from '@/lib/ai-analytics'

interface AIInsightsProps {
  className?: string
}

export function AIInsights({ className }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics/ai-insights', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights')
      }

      const data = await response.json()
      setInsights(data.insights)
      setLastUpdated(data.generatedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
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

  const getTypeColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'prediction':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your project data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating insights...</span>
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
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your project data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchInsights} variant="outline">
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
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your project data
            </CardDescription>
          </div>
          <Button onClick={fetchInsights} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No insights available at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add more project data to get AI-powered insights
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge className={getTypeColor(insight.type)} variant="outline">
                        {insight.type}
                      </Badge>
                      <Badge className={getImpactColor(insight.impact)} variant="outline">
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{insight.description}</p>
                    
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Recommended Actions:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {insight.actionItems.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
