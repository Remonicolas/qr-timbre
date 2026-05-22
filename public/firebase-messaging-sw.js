importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js')

firebase.initializeApp({
  apiKey: "AIza...",
  authDomain: "qr-bell-b35ff.firebaseapp.com",
  projectId: "qr-bell-b35ff",
  storageBucket: "qr-bell-b35ff.appspot.com",
  messagingSenderId: "652914523099",
  appId: "1:652914523099:web:37d9eb04f485289511c5fe",
})

const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('📩 Background message:', payload)

  return self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    }
  )
})