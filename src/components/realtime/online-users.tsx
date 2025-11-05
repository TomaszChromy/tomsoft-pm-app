'use client'

import { useSocket } from '@/hooks/use-socket'
import { Users, Circle } from 'lucide-react'

interface OnlineUsersProps {
  showCount?: boolean
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
}

export function OnlineUsers({ showCount = true, maxVisible = 5, size = 'md' }: OnlineUsersProps) {
  const { onlineUsers, isConnected } = useSocket()

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const visibleUsers = onlineUsers.slice(0, maxVisible)
  const remainingCount = Math.max(0, onlineUsers.length - maxVisible)

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Circle className="w-2 h-2 fill-current" />
        <span className="text-sm">Offline</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Online indicator */}
      <div className="flex items-center gap-1">
        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
        {showCount && (
          <span className="text-sm text-gray-600">
            {onlineUsers.length} online
          </span>
        )}
      </div>

      {/* User avatars */}
      {visibleUsers.length > 0 && (
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <div
              key={user.id}
              className={`relative ${sizeClasses[size]} bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white`}
              title={user.name}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`${sizeClasses[size]} rounded-full object-cover`}
                />
              ) : (
                <span className="font-medium text-indigo-600">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              )}
              
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
          ))}
          
          {/* Remaining count */}
          {remainingCount > 0 && (
            <div
              className={`relative ${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center border-2 border-white`}
              title={`+${remainingCount} więcej`}
            >
              <span className="font-medium text-gray-600">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Detailed online users list component
export function OnlineUsersList() {
  const { onlineUsers, isConnected } = useSocket()

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Circle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm">Brak połączenia</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Użytkownicy online</h3>
          <span className="text-sm text-gray-500">({onlineUsers.length})</span>
        </div>
      </div>
      
      <div className="p-4">
        {onlineUsers.length > 0 ? (
          <div className="space-y-3">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-indigo-600">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Circle className="w-1.5 h-1.5 fill-current" />
                    Online
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Brak użytkowników online</p>
          </div>
        )}
      </div>
    </div>
  )
}
