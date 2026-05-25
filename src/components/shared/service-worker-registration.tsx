'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            '/service-worker.js'
          )

        console.log(
          '✅ Service Worker registrado:',
          registration.scope
        )
      } catch (err) {
        console.error(
          '❌ Error SW:',
          err
        )
      }
    }

    register()
  }, [])

  return null
}