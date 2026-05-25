'use client'

import { useCallback, useEffect, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging'

export type PushState =
  | 'loading'
  | 'unsupported'
  | 'idle'
  | 'subscribing'
  | 'subscribed'
  | 'denied'
  | 'error'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

export function useFirebasePush() {
  const [state, setState] = useState<PushState>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // =========================
  // INIT CHECK
  // =========================
  useEffect(() => {
    async function check() {
      const supported = await isSupported()

      if (!supported) return setState('unsupported')

      if (Notification.permission === 'granted') {
        return setState('subscribed')
      }

      if (Notification.permission === 'denied') {
        return setState('denied')
      }

      setState('idle')
    }

    check()
  }, [])

  // =========================
  // SUBSCRIBE
  // =========================
  const subscribe = useCallback(async (): Promise<PushState> => {
    try {
      setState('subscribing')
      setErrorMessage(null)

      const supported = await isSupported()
      if (!supported) {
        setState('unsupported')
        return 'unsupported'
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return 'denied'
      }

      const app =
        getApps().length > 0
          ? getApps()[0]!
          : initializeApp(firebaseConfig)

      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      )

      await navigator.serviceWorker.ready

      const messaging = getMessaging(app)

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        serviceWorkerRegistration: registration,
      })

      if (!fcmToken) throw new Error('No FCM token')

      setToken(fcmToken)

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcm_token: fcmToken,
          device_name: navigator.platform,
          browser: navigator.userAgent,
        }),
      })

      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title ?? 'QR Bell', {
            body: payload.notification.body,
            icon: '/icons/icon-192x192.png',
          })
        }
      })

      setState('subscribed')
      return 'subscribed'
    } catch (e) {
      console.error(e)
      setErrorMessage('Error activando push')
      setState('error')
      return 'error'
    }
  }, [])

  // =========================
  // UNSUBSCRIBE (REAL SIMPLE)
  // =========================
  const unsubscribe = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcm_token: token }),
        })
      }

      setToken(null)
      setState('idle')
    } catch (e) {
      console.error(e)
    }
  }, [token])

  return {
    state,
    subscribe,
    unsubscribe,
    errorMessage,
  }
}