// ============================================================
// QR BELL - Service Worker
// Handles: Push Notifications, Background Sync, Offline Cache
// ============================================================

const CACHE_NAME = 'qrbell-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ─── Install ─────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch (Network First with Cache Fallback) ────────────────

self.addEventListener('fetch', (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return
  if (event.request.url.includes('supabase')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
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
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    tag: payload.tag || 'qrbell-notification',
    data: payload.data || {},
    requireInteraction: payload.requireInteraction ?? true,
    vibrate: payload.vibrate || [200, 100, 200],
    actions: payload.actions || [
      { action: 'view', title: '👀 Ver' },
      { action: 'dismiss', title: 'Ignorar' },
    ],
    silent: false,
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || '🔔 QR Bell', options)
  )
})

// ─── Notification Click ───────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const action = event.action

  let url = '/dashboard'
  if (data.url) url = data.url
  if (data.ring_event_id) url = '/dashboard/historial'
  if (action === 'dismiss') return

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window
        const existingClient = clients.find((c) => c.url.includes('/dashboard'))
        if (existingClient) {
          existingClient.focus()
          existingClient.postMessage({ type: 'NOTIFICATION_CLICK', data })
          return
        }
        // Open new window
        return self.clients.openWindow(url)
      })
  )
})

// ─── Notification Close ───────────────────────────────────────

self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  // Could track dismissal analytics here
  console.log('[SW] Notification dismissed:', data)
})

// ─── Background Sync ──────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rings') {
    event.waitUntil(syncPendingRings())
  }
})

async function syncPendingRings() {
  // Sync any rings queued while offline
  const cache = await caches.open(CACHE_NAME)
  const pendingRings = await cache.match('/pending-rings')
  if (!pendingRings) return

  const rings = await pendingRings.json()
  for (const ring of rings) {
    try {
      await fetch('/api/rings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ring),
      })
    } catch (err) {
      console.error('[SW] Failed to sync ring:', err)
    }
  }
  await cache.delete('/pending-rings')
}

// ─── Message Handler ──────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
