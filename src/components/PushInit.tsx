'use client'

import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { messaging } from '@/lib/firebase/firebase'
import { createClient } from '@/lib/supabase/client'

export default function PushInit() {
  useEffect(() => {
    async function initPush() {
      try {
        console.log('🔥 PushInit mounted')

        if (!messaging) return

        const permission = await Notification.requestPermission()
        console.log('🔔 permission:', permission)

        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js'
        )

        console.log('✅ SW registered')

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
          serviceWorkerRegistration: registration,
        })

        console.log('📲 FCM TOKEN:', token)

        // 🧠 GUARDAR TOKEN EN SUPABASE
        const supabase = createClient()

        const { data: userData } = await supabase.auth.getUser()

        const user = userData?.user
        if (!user) return

        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          token,
          is_active: true,
        })

        // 🔥 SUSCRIBIR AL TOPIC
        await fetch('/api/push/subscribe-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
          }),
        })
      } catch (err) {
        console.error('❌ PUSH ERROR:', err)
      }
    }

    initPush()
  }, [])

  return null
}