// ============================================================
// Firebase Messaging SW - Stable v8
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

const messaging = firebase.messaging()

console.log('🔥 Firebase Messaging SW loaded')

// ============================================================
// BACKGROUND PUSH
// ============================================================

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('📩 Background message:', payload)

  return self.registration.showNotification(
    payload.notification?.title || '🔔 QR Bell',
    {
      body:
        payload.notification?.body ||
        'Alguien tocó tu timbre',

      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',

      requireInteraction: true,
    }
  )
})

// ============================================================
// CLICK
// ============================================================

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/dashboard')
  )
})