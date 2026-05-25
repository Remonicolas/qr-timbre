import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as webpush from 'web-push'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// =========================================================
// VAPID CONFIG
// =========================================================
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const supabase = await createClient()

    // =========================================================
    // GET PROPERTY
    // =========================================================
    const { data: property } = await supabase
      .from('properties')
      .select('id, user_id, name')
      .eq('qr_code', body.qr_code)
      .single()

    if (!property) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    // =========================================================
    // GET SUBSCRIPTIONS
    // =========================================================
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', property.user_id)
      .eq('is_active', true)

    // =========================================================
    // PUSH PAYLOAD
    // =========================================================
    const payload = JSON.stringify({
      title: `🔔 ${property.name}`,

      body:
        body.visitor_message ??
        'Alguien tocó el timbre',

      icon: '/icons/icon-192x192.png',

      badge: '/icons/icon-192x192.png',

      tag: 'ring-event',

      url: '/dashboard',

      vibrate: [200, 100, 200],

      requireInteraction: true,

      silent: false,

      renotify: true,
    })

    // =========================================================
    // SEND WEB PUSH
    // =========================================================
    if (subs?.length) {
      await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
            {
              TTL: 2419200,
              urgency: 'high',
              topic: 'ring-event',
              headers: {
                Topic: 'ring-event',
              },
            }
          )
        )
      )
    }

    // =========================================================
    // GET USER WHATSAPP
    // =========================================================
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('whatsapp_number')
      .eq('id', property.user_id)
      .single()

    // =========================================================
    // SEND WHATSAPP
    // =========================================================
    if (profile?.whatsapp_number) {
      await sendWhatsAppMessage(
        profile.whatsapp_number,
        `🔔 Alguien tocó el timbre en ${property.name}`
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (err) {
    console.error('RINGS ERROR:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}