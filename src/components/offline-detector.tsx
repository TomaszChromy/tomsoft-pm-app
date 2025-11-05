'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowNotification(true)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)

      // Update last sync time
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastSync', new Date().toISOString())
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowNotification(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showNotification) {
    return null
  }

  return (
    <div className={`offline-indicator ${showNotification ? 'show' : ''}`}>
      <div className="flex items-center justify-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Połączenie przywrócone</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Brak połączenia internetowego</span>
          </>
        )}
      </div>
    </div>
  )
}
