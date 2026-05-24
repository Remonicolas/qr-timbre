importScripts(
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'
)

importScripts(
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js'
)

// ============================================================
// SERVICE WORKER LIFECYCLE
// ============================================================

self.addEventListener('install', () => {
  console.log('✅ SW installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('✅ SW activated')

  event.waitUntil(
    self.clients.claim()
  )
})

// ============================================================
// FIREBASE INIT
// ============================================================

firebase.initializeApp({
  apiKey: 'AIzaSyAMccT2QjlwlNjlpacEs1FmUa2oxz7FeYc',
  authDomain: 'qr-bell-b35ff.firebaseapp.com',
  projectId: 'qr-bell-b35ff',
  storageBucket: 'qr-bell-b35ff.firebasestorage.app',
  messagingSenderId: '652914523099',
  appId: '1:652914523099:web:37d9eb04f485289511c5fe',
})

const messaging = firebase.messaging()

// ============================================================
// BACKGROUND PUSH NOTIFICATIONS
// ============================================================

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background push:', payload)

  const title =
    payload.notification?.title ||
    'QR Bell'

  const options = {
    body:
      payload.notification?.body ||
      'Alguien tocó tu timbre 🔔',

    icon: '/icons/icon-192x192.png',

    badge: '/icons/badge-72x72.png',

    vibrate: [200, 100, 200, 100, 400],

    requireInteraction: true,

    renotify: true,

    tag:
      payload.data?.tag ||
      'qrbell-ring',

    data: {
      url:
        payload.data?.url ||
        '/actividad',
    },

    actions: [
      {
        action: 'open',
        title: 'Ver actividad',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  }

  self.registration.showNotification(
    title,
    options
  )
})

// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()

    if (event.action === 'close') {
      return
    }

    const targetUrl =
      event.notification.data?.url ||
      '/actividad'

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(targetUrl)
              return client.focus()
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(
              targetUrl
            )
          }
        })
    )
  }
)