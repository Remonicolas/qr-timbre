'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messaging } from '@/lib/firebase/firebase'

export default function PushInit() {
  useEffect(() => {
    async function initPush() {
      try {
        console.log('🔥 PushInit mounted')

        if (!messaging) {
          console.log('❌ Messaging unavailable')
          return
        }

        const permission =
          await Notification.requestPermission()

        console.log('🔔 permission:', permission)

        if (permission !== 'granted') return

        const registration =
          await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js'
          )

        console.log('✅ SW registered')

        const token = await getToken(messaging, {
          vapidKey:
            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
          serviceWorkerRegistration: registration,
        })

        console.log('📲 FCM TOKEN:', token)

        // TODO:
        // guardar token en Supabase
      } catch (err) {
        console.error('❌ PUSH ERROR:', err)
      }
    }

    initPush()
  }, [])

  return null
}