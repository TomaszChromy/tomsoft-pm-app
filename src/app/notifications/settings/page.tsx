'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, MessageSquare, Phone, Save } from 'lucide-react'

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

const Button = ({ children, onClick, variant = 'default', className = '', disabled = false }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'default' | 'primary' | 'outline',
  className?: string,
  disabled?: boolean
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

interface NotificationSettings {
  id: string
  emailEnabled: boolean
  emailTaskAssigned: boolean
  emailTaskCompleted: boolean
  emailProjectUpdate: boolean
  emailDeadlineReminder: boolean
  emailDigestFrequency: string
  pushEnabled: boolean
  pushTaskAssigned: boolean
  pushTaskCompleted: boolean
  pushProjectUpdate: boolean
  pushDeadlineReminder: boolean
  slackEnabled: boolean
  slackWebhookUrl?: string
  slackChannel?: string
  slackTaskAssigned: boolean
  slackTaskCompleted: boolean
  slackProjectUpdate: boolean
  smsEnabled: boolean
  smsPhoneNumber?: string
  smsUrgentOnly: boolean
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        alert('Ustawienia zostały zapisane!')
      } else {
        alert('Błąd podczas zapisywania ustawień')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      alert('Błąd podczas zapisywania ustawień')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie ustawień...</div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Błąd podczas ładowania ustawień powiadomień</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ustawienia Powiadomień</h1>
        <p className="text-gray-600 mt-2">Skonfiguruj sposób otrzymywania powiadomień</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Powiadomienia Email
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Włącz powiadomienia email</span>
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              {settings.emailEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Przypisanie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.emailTaskAssigned}
                      onChange={(e) => updateSetting('emailTaskAssigned', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Ukończenie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.emailTaskCompleted}
                      onChange={(e) => updateSetting('emailTaskCompleted', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Aktualizacje projektu</span>
                    <input
                      type="checkbox"
                      checked={settings.emailProjectUpdate}
                      onChange={(e) => updateSetting('emailProjectUpdate', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Przypomnienia o terminach</span>
                    <input
                      type="checkbox"
                      checked={settings.emailDeadlineReminder}
                      onChange={(e) => updateSetting('emailDeadlineReminder', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Częstotliwość podsumowań
                    </label>
                    <select
                      value={settings.emailDigestFrequency}
                      onChange={(e) => updateSetting('emailDigestFrequency', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="daily">Codziennie</option>
                      <option value="weekly">Tygodniowo</option>
                      <option value="never">Nigdy</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Powiadomienia Push
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Włącz powiadomienia push</span>
                <input
                  type="checkbox"
                  checked={settings.pushEnabled}
                  onChange={(e) => updateSetting('pushEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              {settings.pushEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Przypisanie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.pushTaskAssigned}
                      onChange={(e) => updateSetting('pushTaskAssigned', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Ukończenie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.pushTaskCompleted}
                      onChange={(e) => updateSetting('pushTaskCompleted', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Aktualizacje projektu</span>
                    <input
                      type="checkbox"
                      checked={settings.pushProjectUpdate}
                      onChange={(e) => updateSetting('pushProjectUpdate', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Przypomnienia o terminach</span>
                    <input
                      type="checkbox"
                      checked={settings.pushDeadlineReminder}
                      onChange={(e) => updateSetting('pushDeadlineReminder', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Integracja Slack
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Włącz integrację Slack</span>
                <input
                  type="checkbox"
                  checked={settings.slackEnabled}
                  onChange={(e) => updateSetting('slackEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              {settings.slackEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.slackWebhookUrl || ''}
                      onChange={(e) => updateSetting('slackWebhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kanał (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={settings.slackChannel || ''}
                      onChange={(e) => updateSetting('slackChannel', e.target.value)}
                      placeholder="#general"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Przypisanie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.slackTaskAssigned}
                      onChange={(e) => updateSetting('slackTaskAssigned', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Ukończenie zadania</span>
                    <input
                      type="checkbox"
                      checked={settings.slackTaskCompleted}
                      onChange={(e) => updateSetting('slackTaskCompleted', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Aktualizacje projektu</span>
                    <input
                      type="checkbox"
                      checked={settings.slackProjectUpdate}
                      onChange={(e) => updateSetting('slackProjectUpdate', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Powiadomienia SMS
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Włącz powiadomienia SMS</span>
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => updateSetting('smsEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              {settings.smsEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numer telefonu
                    </label>
                    <input
                      type="tel"
                      value={settings.smsPhoneNumber || ''}
                      onChange={(e) => updateSetting('smsPhoneNumber', e.target.value)}
                      placeholder="+48 123 456 789"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Tylko pilne powiadomienia</span>
                    <input
                      type="checkbox"
                      checked={settings.smsUrgentOnly}
                      onChange={(e) => updateSetting('smsUrgentOnly', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={saveSettings}
          variant="primary"
          disabled={saving}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </Button>
      </div>
    </div>
  )
}
