'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo en producción y si el browser lo soporta
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV === 'development'
    ) {
      return
    }

    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none',
        })
      } catch (err) {
        console.warn('[QRBell] Service Worker registration failed:', err)
      }
    }

    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW, { once: true })
    }
  }, [])

  return null
}
