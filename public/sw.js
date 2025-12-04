// Service Worker for aggressive caching and offline support
const CACHE_NAME = 'kyc-platform-v1'
const RUNTIME_CACHE = 'kyc-runtime-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip external requests (APIs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Cache images, fonts, and static assets
        if (
          event.request.destination === 'image' ||
          event.request.destination === 'font' ||
          event.request.url.includes('/_next/static/')
        ) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
    })
  )
})

