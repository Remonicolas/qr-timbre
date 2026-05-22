'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messagingPromise } from '@/lib/firebase/firebase'

export default function PushInit() {
  useEffect(() => {
    const init = async () => {
      console.log('🔥 PushInit mounted')

      const permission = await Notification.requestPermission()
      console.log('🔔 permission:', permission)

      if (permission !== 'granted') return

      const messaging = await messagingPromise
      if (!messaging) {
        console.log('❌ messaging not supported')
        return
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      })

      console.log('📲 FCM TOKEN:', token)

      // 👉 guardar en Supabase
      await fetch('/api/push/register', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    }

    init()
  }, [])

  return null
}