'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messagingPromise } from '@/lib/firebase/firebase'
import { createClient } from '@/lib/supabase/client'

export default function PushInit() {
  useEffect(() => {
    const init = async () => {
      try {
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

        // 🔥 Supabase session
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          console.log('❌ no session')
          return
        }

        // 👉 guardar en backend
        await fetch('/api/push/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        })
      } catch (err) {
        console.error('❌ PUSH INIT ERROR:', err)
      }
    }

    init()
  }, [])

  return null
}