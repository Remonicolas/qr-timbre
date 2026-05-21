// ============================================================
// Firebase Messaging Service Worker (SOLO PUSH)
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAMccT2QjlwlNjlpacEs1FmUa2oxz7FeYc",
  authDomain: "qr-bell-b35ff.firebaseapp.com",
  projectId: "qr-bell-b35ff",
  storageBucket: "qr-bell-b35ff.firebasestorage.app",
  messagingSenderId: "652914523099",
  appId: "1:652914523099:web:37d9eb04f485289511c5fe",
});

const messaging = firebase.messaging();

// BACKGROUND PUSH
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '🔔 QR Bell';

  const options = {
    body: payload.notification?.body || 'Alguien tocó tu timbre',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    requireInteraction: true,
  };

  self.registration.showNotification(title, options);
});

// CLICK NOTIFICATION
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});