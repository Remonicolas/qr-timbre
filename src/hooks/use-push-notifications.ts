// ============================================================
// QR BELL — iOS-compatible Push Notification Hook
// Handles: iOS Safari PWA, Android Chrome, Desktop
// Requirements: iOS 16.4+, must be in standalone mode on iOS
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_ROUTES } from '@/config/app'

export type PushState =
  | 'loading'          // checking current state
  | 'unsupported'      // browser doesn't support push
  | 'not_standalone'   // iOS but not installed as PWA yet
  | 'not_installed'    // Android/desktop: can show install prompt
  | 'idle'             // supported, not subscribed, not denied
  | 'subscribing'      // permission dialog open / subscribing in progress
  | 'subscribed'       // active subscription
  | 'denied'           // user denied permission
  | 'error'            // subscription failed

export interface PushNotificationState {
  state: PushState
  isIOS: boolean
  isStandalone: boolean
  isSupported: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  errorMessage: string | null
}

// ─── Helpers ─────────────────────────────────────────────────

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari standalone detection
  if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) return true
  // Generic: matchMedia for display-mode: standalone (works on Android too)
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function detectPushSupport(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Correct VAPID key conversion — handles all key sizes reliably
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Correct ArrayBuffer → base64 conversion for p256dh and auth keys
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function getDeviceInfo(): { device_name: string; browser: string } {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  if (ua.includes('CriOS')) browser = 'Chrome iOS'
  else if (ua.includes('FxiOS')) browser = 'Firefox iOS'
  else if (ua.includes('Safari') && ua.includes('iPhone')) browser = 'Safari iOS'
  else if (ua.includes('Safari') && ua.includes('iPad')) browser = 'Safari iPadOS'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'

  const device = ua.includes('iPhone') ? 'iPhone'
    : ua.includes('iPad') ? 'iPad'
    : ua.includes('Android') ? 'Android'
    : 'Desktop'

  return {
    device_name: device,
    browser: browser,
  }
}

// ─── Main Hook ───────────────────────────────────────────────

export function usePushNotifications(): PushNotificationState {
  const [state, setState] = useState<PushState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isIOS] = useState(detectIOS)
  const [isStandalone] = useState(detectStandalone)
  const [isSupported] = useState(detectPushSupport)

  // Check initial state on mount
  useEffect(() => {
    async function checkState() {
      // Not supported at all
      if (!isSupported) {
        setState('unsupported')
        return
      }

      // iOS but NOT installed as standalone PWA
      // Push notifications REQUIRE standalone mode on iOS
      if (isIOS && !isStandalone) {
        setState('not_standalone')
        return
      }

      // Check existing browser permission
      const permission = Notification.permission
      if (permission === 'denied') {
        setState('denied')
        return
      }

      // Check if already subscribed via SW
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          setState('subscribed')
          return
        }
      } catch {
        // SW not ready yet, that's ok
      }

      setState('idle')
    }

    // Small delay to let SW initialize
    const timer = setTimeout(checkState, 500)
    return () => clearTimeout(timer)
  }, [isIOS, isStandalone, isSupported])

  const subscribe = useCallback(async () => {
    setErrorMessage(null)
    setState('subscribing')

    try {
      // Step 1: Request permission
      // On iOS this MUST be triggered by a user gesture (button click)
      const permission = await Notification.requestPermission()

      if (permission === 'denied') {
        setState('denied')
        setErrorMessage('Permiso denegado. Habilitá las notificaciones en Configuración.')
        return
      }

      if (permission !== 'granted') {
        setState('idle')
        return
      }

      // Step 2: Wait for SW to be ready and controlling the page
      const registration = await navigator.serviceWorker.ready

      // Ensure SW is actually controlling this page (critical for iOS)
      if (!navigator.serviceWorker.controller) {
        // Force SW to take control
        await new Promise<void>((resolve) => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
            resolve()
          }
          navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
          // Trigger skipWaiting on the active SW
          registration.active?.postMessage({ type: 'SKIP_WAITING' })
          // Timeout fallback
          setTimeout(resolve, 2000)
        })
      }

      // Step 3: Get VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('VAPID key not configured')
      }

      // Step 4: Unsubscribe any stale subscription first
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        await existing.unsubscribe()
      }

      // Step 5: Subscribe to push — this registers with APNs on iOS
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,  // Required — false throws on iOS
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      // Step 6: Extract keys correctly
      const p256dhBuffer = subscription.getKey('p256dh')
      const authBuffer = subscription.getKey('auth')

      if (!p256dhBuffer || !authBuffer) {
        throw new Error('Failed to get subscription keys')
      }

      const p256dh = arrayBufferToBase64(p256dhBuffer)
      const auth = arrayBufferToBase64(authBuffer)
      const { device_name, browser } = getDeviceInfo()

      // Step 7: Save subscription to backend
      const res = await fetch(API_ROUTES.subscribe, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          device_name,
          browser,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to save subscription')
      }

      setState('subscribed')
    } catch (err) {
      console.error('[Push] Subscribe error:', err)
      const msg = err instanceof Error ? err.message : 'Error desconocido'

      if (msg.includes('VAPID')) {
        setErrorMessage('Configuración de servidor incompleta. Contactá soporte.')
      } else if (msg.includes('permission')) {
        setErrorMessage('Permisos denegados. Habilitá en Configuración de iOS.')
      } else {
        setErrorMessage('No se pudieron activar las notificaciones. Intentá de nuevo.')
      }

      setState('error')
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch(API_ROUTES.subscribe, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setState('idle')
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err)
    }
  }, [])

  return {
    state,
    isIOS,
    isStandalone,
    isSupported,
    subscribe,
    unsubscribe,
    errorMessage,
  }
}
