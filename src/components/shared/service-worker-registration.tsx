'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js'
          )

        console.log(
          '✅ Firebase Service Worker registrado:',
          registration.scope
        )
      } catch (error) {
        console.error(
          '❌ Error registrando Service Worker:',
          error
        )
      }
    }

    registerServiceWorker()
  }, [])

  return null
}