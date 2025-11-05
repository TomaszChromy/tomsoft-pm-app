'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Home, Clock, CheckSquare, FolderOpen } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Get last sync time from localStorage
    const lastSyncTime = localStorage.getItem('lastSync')
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime))
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      window.location.href = '/dashboard'
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const offlineFeatures = [
    {
      icon: CheckSquare,
      title: 'Przeglądaj zadania',
      description: 'Zobacz ostatnio synchronizowane zadania',
      href: '/tasks'
    },
    {
      icon: FolderOpen,
      title: 'Projekty',
      description: 'Dostęp do informacji o projektach',
      href: '/projects'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Kontynuuj śledzenie czasu pracy',
      href: '/time-tracking'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main offline card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6">
          {/* Status indicator */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isOnline ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isOnline ? (
              <RefreshCw className="w-10 h-10 text-green-600" />
            ) : (
              <WifiOff className="w-10 h-10 text-red-600" />
            )}
          </div>

          {/* Title and description */}
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {isOnline ? 'Łączenie...' : 'Jesteś offline'}
          </h1>
          
          <p className="text-slate-600 mb-6">
            {isOnline 
              ? 'Przywracamy połączenie z serwerem...'
              : 'Sprawdź połączenie internetowe. Niektóre funkcje są dostępne offline.'
            }
          </p>

          {/* Last sync info */}
          {lastSync && (
            <div className="bg-slate-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-slate-500">
                Ostatnia synchronizacja:
              </p>
              <p className="text-sm font-medium text-slate-700">
                {lastSync.toLocaleString('pl-PL')}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isOnline
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {isOnline ? 'Przejdź do Dashboard' : 'Spróbuj ponownie'}
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full py-3 px-4 rounded-lg font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Home className="w-4 h-4 inline mr-2" />
              Strona główna
            </button>
          </div>
        </div>

        {/* Offline features */}
        {!isOnline && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Dostępne offline
            </h2>
            
            <div className="space-y-3">
              {offlineFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <a
                    key={index}
                    href={feature.href}
                    className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {feature.description}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Connection status */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* PWA info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            TomSoft PM • Progressive Web App
          </p>
        </div>
      </div>
    </div>
  )
}
