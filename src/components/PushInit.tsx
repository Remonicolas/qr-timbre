'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messagingPromise } from '@/lib/firebase/firebase'
import { createClient } from '@/lib/supabase/client'

export default function PushInit() {
  useEffect(() => {
    const supabase = createClient()

    const registerPush = async (session: any) => {
      try {
        if (!session?.access_token) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const messaging = await messagingPromise
        if (!messaging) return

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        })

        if (!token) return

        console.log('📲 FCM TOKEN:', token)

        await fetch('/api/push/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        })
      } catch (err) {
        console.error('PUSH ERROR:', err)
      }
    }

    // 🔥 CLAVE: escuchar login real
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          registerPush(session)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return null
}