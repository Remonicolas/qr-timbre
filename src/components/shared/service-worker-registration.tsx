'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        // PWA SW (principal)
        await navigator.serviceWorker.register('/service-worker.js')

        // Firebase SW (push)
        await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      } catch (e) {
        console.error('SW error:', e)
      }
    }

    window.addEventListener('load', register)
  }, [])

  return null
}