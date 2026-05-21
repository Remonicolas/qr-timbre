// public/firebase-messaging-sw.js

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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message ', payload);

  const notificationTitle = payload.notification?.title || 'QR Bell';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});