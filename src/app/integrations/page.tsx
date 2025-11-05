'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  Cog6ToothIcon, 
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Integration {
  id: string
  name: string
  type: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: 'PENDING' | 'IN_PROGRESS' | 'SYNCED' | 'ERROR' | 'CANCELLED'
  syncError: string | null
  createdAt: string
  _count: {
    repositories: number
    calendarEvents: number
    webhooks: number
  }
}

const integrationTypes = {
  GITHUB: {
    name: 'GitHub',
    description: 'Sync repositories, issues, and pull requests',
    icon: '🐙',
    color: 'bg-gray-900 text-white',
  },
  GITLAB: {
    name: 'GitLab',
    description: 'Sync repositories, issues, and merge requests',
    icon: '🦊',
    color: 'bg-orange-600 text-white',
  },
  JIRA: {
    name: 'Jira',
    description: 'Sync issues, sprints, and project data',
    icon: '🔷',
    color: 'bg-blue-600 text-white',
  },
  GOOGLE_CALENDAR: {
    name: 'Google Calendar',
    description: 'Sync events and create calendar entries from tasks',
    icon: '📅',
    color: 'bg-green-600 text-white',
  },
  ZAPIER: {
    name: 'Zapier',
    description: 'Connect with 5000+ apps via webhooks',
    icon: '⚡',
    color: 'bg-orange-500 text-white',
  },
  SLACK: {
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    icon: '💬',
    color: 'bg-purple-600 text-white',
  },
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchIntegrations() // Refresh list
      } else {
        const error = await response.json()
        alert(`Sync failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchIntegrations() // Refresh list
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Delete failed')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'IN_PROGRESS':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return 'Synced'
      case 'ERROR':
        return 'Error'
      case 'IN_PROGRESS':
        return 'Syncing...'
      case 'PENDING':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Connect TomSoft PM with your favorite tools</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Integration
        </button>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
          <p className="text-gray-600 mb-6">Connect your favorite tools to streamline your workflow</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const typeInfo = integrationTypes[integration.type as keyof typeof integrationTypes]
            
            return (
              <div key={integration.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeInfo?.color || 'bg-gray-500'} flex items-center justify-center text-lg`}>
                      {typeInfo?.icon || '🔗'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-600">{typeInfo?.name || integration.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => syncIntegration(integration.id)}
                      disabled={syncing === integration.id || !integration.isActive}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="Sync now"
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${syncing === integration.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Settings"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteIntegration(integration.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  {getStatusIcon(integration.syncStatus)}
                  <span className="text-sm text-gray-600">
                    {getStatusText(integration.syncStatus)}
                  </span>
                  {!integration.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Error Message */}
                {integration.syncError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700">{integration.syncError}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {integration._count.repositories}
                    </div>
                    <div className="text-xs text-gray-600">Repos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {integration._count.calendarEvents}
                    </div>
                    <div className="text-xs text-gray-600">Events</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {integration._count.webhooks}
                    </div>
                    <div className="text-xs text-gray-600">Webhooks</div>
                  </div>
                </div>

                {/* Last Sync */}
                {integration.lastSyncAt && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Integration</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(integrationTypes).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => {
                    // Handle integration setup
                    alert(`${info.name} integration setup coming soon!`)
                    setShowAddModal(false)
                  }}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded ${info.color} flex items-center justify-center text-sm`}>
                      {info.icon}
                    </div>
                    <h3 className="font-medium text-gray-900">{info.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
