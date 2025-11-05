'use client'

import { useState, useRef, useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { 
  Bell, 
  X, 
  CheckCircle, 
  MessageSquare, 
  UserPlus, 
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react'

export function NotificationCenter() {
  const { notifications, isConnected, clearNotifications, removeNotification } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update unread count when new notifications arrive
  useEffect(() => {
    setUnreadCount(notifications.length)
  }, [notifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'assignment':
        return <UserPlus className="w-4 h-4 text-purple-500" />
      case 'deadline':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Teraz'
    if (diffInMinutes < 60) return `${diffInMinutes}m temu`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h temu`
    return date.toLocaleDateString('pl-PL')
  }

  const handleNotificationClick = (notification: any) => {
    // Navigate to relevant page based on notification
    if (notification.taskId) {
      window.location.href = `/tasks?taskId=${notification.taskId}`
    } else if (notification.projectId) {
      window.location.href = `/projects/${notification.projectId}`
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isConnected 
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
            : 'text-gray-400'
        }`}
        title={isConnected ? 'Powiadomienia' : 'Brak połączenia'}
      >
        <Bell className="w-5 h-5" />
        
        {/* Connection indicator */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Unread count */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Powiadomienia</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  title="Wyczyść wszystkie"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`px-4 py-2 text-xs ${
            isConnected 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {isConnected ? '🟢 Połączono - powiadomienia na żywo' : '🔴 Brak połączenia'}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(index)
                          }}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Brak nowych powiadomień</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/notifications'
                  setIsOpen(false)
                }}
                className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Zobacz wszystkie powiadomienia
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
