'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  installPrompt: BeforeInstallPromptEvent | null
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
    installPrompt: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if app is installed
    const checkInstalled = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://')

      setState(prev => ({ ...prev, isInstalled }))
    }

    // Check online status
    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }))
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installPrompt = e as BeforeInstallPromptEvent
      setState(prev => ({ 
        ...prev, 
        isInstallable: true, 
        installPrompt 
      }))
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false, 
        installPrompt: null 
      }))
    }

    // Register service worker and check for updates
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }))
                }
              })
            }
          })

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
              setState(prev => ({ ...prev, isUpdateAvailable: true }))
            }
          })

        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    // Initial checks
    checkInstalled()
    updateOnlineStatus()
    registerServiceWorker()

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const installApp = async () => {
    if (!state.installPrompt) return false

    try {
      await state.installPrompt.prompt()
      const choiceResult = await state.installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstallable: false, 
          installPrompt: null 
        }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const shareApp = async (data?: { title?: string; text?: string; url?: string }) => {
    const shareData = {
      title: data?.title || 'TomSoft PM',
      text: data?.text || 'Comprehensive Project Management Application',
      url: data?.url || window.location.origin
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return true
      } catch (error) {
        console.error('Share failed:', error)
        return false
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        return true
      } catch (error) {
        console.error('Clipboard write failed:', error)
        return false
      }
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return 'not-supported'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        return existingSubscription
      }

      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return null
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  const getAppInfo = () => {
    return {
      name: 'TomSoft PM',
      version: '1.0.0',
      isStandalone: state.isInstalled,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasNotifications: 'Notification' in window,
      hasShare: 'share' in navigator,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    }
  }

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        return true
      } catch (error) {
        console.error('Cache clear failed:', error)
        return false
      }
    }
    return false
  }

  return {
    ...state,
    installApp,
    updateApp,
    shareApp,
    requestNotificationPermission,
    subscribeToPush,
    getAppInfo,
    clearCache
  }
}
