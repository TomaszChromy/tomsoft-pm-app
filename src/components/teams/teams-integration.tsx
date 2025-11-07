'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Send,
  Video,
  Bell,
  Link,
  Unlink,
  TestTube
} from 'lucide-react'

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
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

const Badge = ({ children, variant, className }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'success' ? 'bg-green-100 text-green-800' :
    variant === 'destructive' ? 'bg-red-100 text-red-800' :
    variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800'
  } ${className}`}>
    {children}
  </span>
)

interface TeamsIntegrationProps {
  className?: string
}

export function TeamsIntegration({ className }: TeamsIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [notifications, setNotifications] = useState({
    projectUpdates: true,
    taskAssignments: true,
    budgetAlerts: true,
    dailySummary: false,
    meetingReminders: true
  })
  const [teamsUserId, setTeamsUserId] = useState('')
  const [isLinked, setIsLinked] = useState(false)
  const [presence, setPresence] = useState<any[]>([])

  useEffect(() => {
    checkConnectionStatus()
    loadUserSettings()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/teams/webhook', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)
        setIsConnected(data.success)
      }
    } catch (error) {
      console.error('Failed to check Teams connection:', error)
    }
  }

  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLinked(!!data.user.teamsUserId)
        setTeamsUserId(data.user.teamsUserId || '')
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/teams/webhook', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      setConnectionStatus(data)
      setIsConnected(data.success)
      
      if (data.success) {
        alert('Teams connection test successful!')
      } else {
        alert(`Teams connection test failed: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to test Teams connection')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/teams/webhook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'custom',
          payload: {
            type: 'MessageCard',
            title: '🧪 Test Notification from TomSoft PM',
            text: 'This is a test notification to verify your Teams integration is working correctly.',
            themeColor: '0078D4'
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Test notification sent successfully!')
      } else {
        alert(`Failed to send test notification: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  const linkTeamsAccount = async () => {
    if (!teamsUserId.trim()) {
      alert('Please enter your Teams User ID')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/teams/presence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamsUserId: teamsUserId.trim(),
          action: 'link'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsLinked(true)
        alert('Teams account linked successfully!')
      } else {
        alert(`Failed to link Teams account: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to link Teams account')
    } finally {
      setIsLoading(false)
    }
  }

  const unlinkTeamsAccount = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/teams/presence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'unlink'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsLinked(false)
        setTeamsUserId('')
        alert('Teams account unlinked successfully!')
      } else {
        alert(`Failed to unlink Teams account: ${data.message}`)
      }
    } catch (error) {
      alert('Failed to unlink Teams account')
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationSettings = async (setting: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [setting]: value }))
    
    // Here you would save to backend
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/user/teams-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications: { ...notifications, [setting]: value }
        })
      })
    } catch (error) {
      console.error('Failed to update notification settings:', error)
    }
  }

  const createProjectMeeting = async () => {
    // This would open a modal to select project and participants
    alert('Project meeting creation feature - would open modal to configure meeting')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Microsoft Teams Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Connection Status:</span>
              {isConnected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-1" />
                Test Connection
              </Button>
              <Button
                onClick={sendTestNotification}
                disabled={isLoading || !isConnected}
                size="sm"
              >
                <Send className="h-4 w-4 mr-1" />
                Send Test
              </Button>
            </div>
          </div>

          {connectionStatus && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Configuration Status</h4>
              <div className="space-y-1 text-sm">
                {connectionStatus.configuration.valid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Configuration is valid
                  </div>
                ) : (
                  <div className="space-y-1">
                    {connectionStatus.configuration.errors.map((error: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Linking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Account Linking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Teams Account:</span>
            {isLinked ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Linked
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not Linked
              </Badge>
            )}
          </div>

          {!isLinked ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teams User ID
                </label>
                <input
                  type="text"
                  value={teamsUserId}
                  onChange={(e) => setTeamsUserId(e.target.value)}
                  placeholder="Enter your Microsoft Teams User ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find your Teams User ID in Teams settings or ask your admin
                </p>
              </div>
              <Button
                onClick={linkTeamsAccount}
                disabled={isLoading || !teamsUserId.trim()}
                size="sm"
              >
                <Link className="h-4 w-4 mr-1" />
                Link Account
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Teams account is linked and ready for presence updates
              </span>
              <Button
                onClick={unlinkTeamsAccount}
                disabled={isLoading}
                variant="destructive"
                size="sm"
              >
                <Unlink className="h-4 w-4 mr-1" />
                Unlink
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <p className="text-xs text-gray-500">
                  {getNotificationDescription(key)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateNotificationSettings(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={createProjectMeeting}
              disabled={!isConnected}
              variant="outline"
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Project Meeting
            </Button>
            <Button
              onClick={() => alert('Team presence feature - would show team status')}
              disabled={!isConnected || !isLinked}
              variant="outline"
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              View Team Presence
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getNotificationDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    projectUpdates: 'Get notified when projects are created, updated, or completed',
    taskAssignments: 'Receive notifications when tasks are assigned to you',
    budgetAlerts: 'Get alerts when project budgets are exceeded',
    dailySummary: 'Receive daily summary of project activities',
    meetingReminders: 'Get reminders for upcoming project meetings'
  }
  
  return descriptions[key] || 'Notification setting'
}
