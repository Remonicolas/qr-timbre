'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messagingPromise } from '@/lib/firebase/firebase'
import { createClient } from '@/lib/supabase/client'

export default function PushInit() {
  useEffect(() => {
    const supabase = createClient()

    const initPush = async (userId: string) => {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const messaging = await messagingPromise
      if (!messaging) return

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      })

      await fetch('/api/push/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({ token }),
      })
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await initPush(session.user.id)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return null
}