'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast('Nueva versión disponible', {
                description: 'Recargá la página para actualizar QR Bell',
                action: {
                  label: 'Recargar',
                  onClick: () => window.location.reload(),
                },
                duration: 10000,
              })
            }
          })
        })

        console.log('[QRBell] Service Worker registered:', registration.scope)
      } catch (err) {
        console.warn('[QRBell] Service Worker registration failed:', err)
      }
    }

    // Register after page load for performance
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return null
}
