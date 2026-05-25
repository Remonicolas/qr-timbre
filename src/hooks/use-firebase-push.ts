'use client'

import { useCallback, useEffect, useState } from 'react'

export type PushState =
  | 'loading'
  | 'unsupported'
  | 'idle'
  | 'subscribing'
  | 'subscribed'
  | 'denied'
  | 'error'

export function useFirebasePush() {
  const [state, setState] = useState<PushState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // =========================================================
  // CHECK STATE
  // =========================================================
  useEffect(() => {
    async function check() {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setState('unsupported')
          return
        }

        const permission = Notification.permission

        if (permission === 'granted') {
          setState('subscribed')
          return
        }

        if (permission === 'denied') {
          setState('denied')
          return
        }

        setState('idle')
      } catch (err) {
        console.error(err)
        setState('unsupported')
      }
    }

    check()
  }, [])

  // =========================================================
  // SUBSCRIBE (WEB PUSH REAL)
  // =========================================================
  const subscribe = useCallback(async (): Promise<PushState> => {
    try {
      setState('subscribing')
      setErrorMessage(null)

      // 1. permiso
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setState('denied')
        return 'denied'
      }

      // 2. service worker
      const registration = await navigator.serviceWorker.ready

      // 3. VAPID KEY desde backend
      const vapidRes = await fetch('/api/push/vapid')
      const { publicKey } = await vapidRes.json()

      // 4. subscribe push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      console.log('📲 SUBSCRIPTION:', subscription)

      // 5. guardar en backend
      const res = await fetch('/api/push/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          user_agent: navigator.userAgent,
        }),
      })

      if (!res.ok) throw new Error('Backend error')

      setState('subscribed')
      return 'subscribed'
    } catch (err) {
      console.error(err)
      setErrorMessage('Error activando push')
      setState('error')
      return 'error'
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      setState('idle')
    } catch (err) {
      console.error(err)
    }
  }, [])

  return {
    state,
    subscribe,
    unsubscribe,
    errorMessage,
  }
}

// =========================================================
// HELPERS
// =========================================================
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}