const CACHE_NAME = 'tomsoft-pm-v1.0.0'
const STATIC_CACHE_NAME = 'tomsoft-pm-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'tomsoft-pm-dynamic-v1.0.0'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/projects',
  '/tasks',
  '/time-tracking',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files here
  '/_next/static/css/app.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js',
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Fonts (if using local fonts)
  '/fonts/inter-var.woff2'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/auth/me',
  '/api/projects',
  '/api/tasks',
  '/api/notifications'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error)
      })
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all pages
  self.clients.claim()
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with network first strategy
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first strategy
    event.respondWith(handleStaticAssets(request))
  } else {
    // Pages - network first with cache fallback
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with network first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for specific endpoints
    if (url.pathname === '/api/auth/me') {
      return new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Return empty array for list endpoints
    if (url.pathname.includes('/api/projects') || url.pathname.includes('/api/tasks')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Handle static assets with cache first strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url)
    throw error
  }
}

// Handle page requests with network first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page as fallback
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Last resort - basic offline message
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TomSoft PM - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: #f8fafc;
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { color: #1e293b; margin-bottom: 1rem; }
            p { color: #64748b; margin-bottom: 2rem; }
            button {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>Jesteś offline</h1>
            <p>Sprawdź połączenie internetowe i spróbuj ponownie.</p>
            <button onclick="window.location.reload()">Spróbuj ponownie</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  if (!event.data) {
    return
  }
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge.png',
    image: data.image,
    data: data.data,
    actions: data.actions,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    silent: data.silent
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  const data = event.notification.data
  let url = '/'
  
  if (event.action) {
    // Handle action buttons
    switch (event.action) {
      case 'view':
        url = data.url || '/'
        break
      case 'dismiss':
        return
      case 'snooze':
        // Handle snooze action
        return
      default:
        url = data.url || '/'
    }
  } else {
    // Handle main notification click
    url = data.url || '/'
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered')
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    console.log('Service Worker: Performing background sync')
    
    // Here you would implement logic to:
    // 1. Send queued offline actions
    // 2. Sync local data with server
    // 3. Update cached data
    
    return Promise.resolve()
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
    throw error
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
