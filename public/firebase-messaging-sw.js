// ============================================================
// Firebase Messaging SW - Stable
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js')

firebase.initializeApp({
  apiKey: "AIzaSyAMccT2QjlwlNjlpacEs1FmUa2oxz7FeYc",
  authDomain: "qr-bell-b35ff.firebaseapp.com",
  projectId: "qr-bell-b35ff",
  storageBucket: "qr-bell-b35ff.appspot.com",
  messagingSenderId: "652914523099",
  appId: "1:652914523099:web:37d9eb04f485289511c5fe",
})

firebase.messaging()

console.log('🔥 Firebase Messaging SW loaded')

// ============================================================
// WEB PUSH BACKGROUND
// ============================================================

self.addEventListener('push', (event) => {
  if (!event.data) return

  const payload = event.data.json()

  console.log('📩 PUSH RECEIVED', payload)

  event.waitUntil(
    self.registration.showNotification(payload.title || '🔔 QR Bell', {
      body:
        payload.body ||
        'Alguien tocó tu timbre',

      icon:
        payload.icon ||
        '/icons/icon-192x192.png',

      badge:
        payload.badge ||
        '/icons/badge-72x72.png',

      vibrate:
        payload.vibrate ||
        [200, 100, 200],

      requireInteraction: true,

      data: payload.data || {},

      actions: payload.actions || [],
    })
  )
})

// ============================================================
// CLICK
// ============================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url =
    event.notification.data?.url ||
    '/dashboard'

  event.waitUntil(
    clients.openWindow(url)
  )
})