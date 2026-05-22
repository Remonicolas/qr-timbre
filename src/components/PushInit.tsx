'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messaging } from '@/lib/firebase/firebase'

export default function PushInit() {
  useEffect(() => {
    async function initPush() {
      console.log('🔥 PushInit mounted')

      if (!('Notification' in window)) return
      if (!navigator.serviceWorker) return
      if (!messaging) return

      const permission = await Notification.requestPermission()

      console.log('🔔 permission:', permission)

      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      )

      console.log('✅ SW registered')

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      console.log('📲 FCM TOKEN:', token)
    }

    initPush()
  }, [])

  return null
}