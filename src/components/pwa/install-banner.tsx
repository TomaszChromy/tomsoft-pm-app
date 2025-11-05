'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor } from 'lucide-react'
import { usePWA } from '@/hooks/use-pwa'

export function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if banner was previously dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed) {
        const dismissedDate = new Date(dismissed)
        const now = new Date()
        const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)

        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          setIsDismissed(true)
          return
        }
      }
    }

    // Show banner if app is installable and not already installed
    if (isInstallable && !isInstalled && !isDismissed) {
      // Delay showing banner by 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, isDismissed])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
    }
  }

  const handleRemindLater = () => {
    setIsVisible(false)
    // Will show again on next visit
  }

  if (!isVisible || isInstalled) {
    return null
  }

  return (
    <>
      {/* Mobile banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Zainstaluj TomSoft PM
                </p>
                <p className="text-xs text-indigo-100">
                  Szybszy dostęp, powiadomienia push
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                className="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                Zainstaluj
              </button>
              <button
                onClick={handleDismiss}
                className="text-indigo-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop banner */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  Zainstaluj aplikację
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Dodaj TomSoft PM do pulpitu dla szybszego dostępu
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Zainstaluj
            </button>
            <button
              onClick={handleRemindLater}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Później
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function UpdateBanner() {
  const { isUpdateAvailable, updateApp } = usePWA()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isUpdateAvailable) {
      setIsVisible(true)
    }
  }, [isUpdateAvailable])

  const handleUpdate = () => {
    updateApp()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-600 text-white rounded-lg shadow-xl p-4 max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Aktualizacja dostępna
              </p>
              <p className="text-xs text-green-100">
                Nowa wersja aplikacji jest gotowa
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-100 hover:text-white transition-colors ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
          >
            Zaktualizuj teraz
          </button>
        </div>
      </div>
    </div>
  )
}
