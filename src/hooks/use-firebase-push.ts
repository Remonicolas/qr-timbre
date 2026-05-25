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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // =========================================================
  // CHECK INITIAL STATE
  // =========================================================
  useEffect(() => {
    async function check() {
      try {
        const supported = await isSupported()

        if (!supported) {
          setState('unsupported')
          return
        }

        if (Notification.permission === 'granted') {
          setState('subscribed')
          return
        }

        if (Notification.permission === 'denied') {
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
  // SUBSCRIBE (FIXED → RETURNS STATE)
  // =========================================================
  const subscribe = useCallback(async (): Promise<PushState> => {
    try {
      setState('subscribing')
      setErrorMessage(null)

      const supported = await isSupported()

      if (!supported) {
        setState('unsupported')
        return 'unsupported'
      }

      // ❗ pedir permiso navegador
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setState('denied')
        return 'denied'
      }

      // firebase init
      const app =
        getApps().length > 0
          ? getApps()[0]!
          : initializeApp(firebaseConfig)

      // service worker
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      )

      await navigator.serviceWorker.ready

      const messaging = getMessaging(app)

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        serviceWorkerRegistration: registration,
      })

      if (!token) {
        throw new Error('No FCM token')
      }

      console.log('🔥 FCM TOKEN:', token)

      // backend
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcm_token: token,
          device_name: navigator.platform,
          browser: navigator.userAgent,
        }),
      })

      if (!res.ok) {
        throw new Error('Backend error')
      }

      // foreground notifications
      onMessage(messaging, (payload) => {
        console.log('📩 FOREGROUND PUSH:', payload)

        if (payload.notification) {
          new Notification(
            payload.notification.title ?? 'QR Bell',
            {
              body: payload.notification.body,
              icon: '/icons/icon-192x192.png',
            }
          )
        }
      })

      setState('subscribed')

      return 'subscribed'
    } catch (err) {
      console.error(err)

      setErrorMessage('No se pudieron activar las notificaciones')
      setState('error')

      return 'error'
    }
  }, [])

  // =========================================================
  // UNSUBSCRIBE
  // =========================================================
  const unsubscribe = useCallback(async () => {
    try {
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