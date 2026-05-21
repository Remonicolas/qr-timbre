'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/service-worker.js',
          {
            scope: '/',
            updateViaCache: 'none',
          }
        )

        // Check for SW updates and notify user
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              toast('Nueva versión disponible', {
                description: 'Tocá para actualizar QR Bell',
                action: {
                  label: 'Actualizar',
                  onClick: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  },
                },
                duration: 10000,
              })
            }
          })
        })

        // iOS: ensure SW takes control immediately
        if (!navigator.serviceWorker.controller) {
          registration.active?.postMessage({ type: 'SKIP_WAITING' })
        }
      } catch (err) {
        // Silent fail — SW is progressive enhancement
        console.warn('[QRBell] SW registration failed:', err)
      }
    }

    // Register after page is fully loaded for better performance
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW, { once: true })
    }
  }, [])

  return null
}
