'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messagingPromise } from '@/lib/firebase/firebase'
import { createClient } from '@/lib/supabase/client'

export default function PushInit() {
  useEffect(() => {
    const supabase = createClient()

    const initPush = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) return

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
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        })
      } catch (err) {
        console.error('PUSH ERROR:', err)
      }
    }

    initPush()
  }, [])

  return null
}