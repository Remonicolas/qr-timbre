self.addEventListener('install', () => {
  console.log('✅ SW installed')
})

self.addEventListener('activate', () => {
  console.log('✅ SW activated')
})

self.addEventListener('push', (event) => {
  console.log('📩 Push received')

  const options = {
    body: 'Push funcionando',
    icon: '/icons/icon-192x192.png',
  }

  event.waitUntil(
    self.registration.showNotification('🔔 QR Bell', options)
  )
})