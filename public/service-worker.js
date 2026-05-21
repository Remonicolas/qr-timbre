// ============================================================
// QR BELL — Service Worker v2
// iOS Safari compatible — Push + Cache + Offline
// ============================================================

const CACHE_VERSION = 'qrbell-v2'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ─── Install ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        // addAll with individual error handling — if one icon 404s don't fail all
        Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  )
})

// ─── Activate ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Never intercept API or Supabase calls
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // For navigation requests (HTML pages): Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          // Offline fallback: serve cached '/' for any navigation
          const cached = await caches.match(request)
          if (cached) return cached
          // Last resort: return the root cached page
          return caches.match('/') ?? Response.error()
        })
    )
    return
  }

  // For static assets (_next/static, icons, fonts): Cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }
})

// ─── Push Notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: '🔔 QR Bell',
      body: event.data.text() || 'Alguien tocó tu timbre',
    }
  }

  const options = {
    body: payload.body || 'Alguien tocó tu timbre',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    tag: payload.tag || 'qrbell-ring',
    data: payload.data || {},
    requireInteraction: true,
    // iOS 16.4+ supports vibrate in SW push
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: '👀 Ver' },
      { action: 'dismiss', title: 'Ignorar' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || '🔔 QR Bell', options)
  )
})

// ─── Notification Click ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const data = event.notification.data || {}
  const targetUrl = data.url || '/dashboard'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.postMessage({ type: 'NOTIFICATION_CLICK', data })
            return
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// ─── Message Handler ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
