'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase/firebase'

export default function PushInit() {
  useEffect(() => {
    async function initPush() {
      try {
        console.log('🔥 PushInit mounted')

        if (!('Notification' in window)) {
          console.log('❌ Notification API missing')
          return
        }

        if (!navigator.serviceWorker) {
          console.log('❌ Service Worker unsupported')
          return
        }

        const messaging =
          await getFirebaseMessaging()

        if (!messaging) {
          console.log('❌ Firebase messaging unsupported')
          return
        }

        const permission =
          await Notification.requestPermission()

        console.log('🔔 permission:', permission)

        if (permission !== 'granted') {
          console.log('❌ Permission denied')
          return
        }

        const registration =
          await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js'
          )

        console.log('✅ SW registered')

        const token = await getToken(messaging, {
          vapidKey:
            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,

          serviceWorkerRegistration: registration,
        })

        console.log('📲 FCM TOKEN:', token)
      } catch (err) {
        console.error('❌ PUSH ERROR:', err)
      }
    }

    initPush()
  }, [])

  return null
}