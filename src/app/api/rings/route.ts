import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as webpush from 'web-push'

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
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // =========================================================
    // GET SUBSCRIPTIONS
    // =========================================================
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', property.user_id)
      .eq('is_active', true)

    if (!subs?.length) {
      return NextResponse.json({ ok: true })
    }

    // =========================================================
    // PUSH PAYLOAD (iOS + Android + Desktop)
    // =========================================================
    const payload = JSON.stringify({
      title: `🔔 ${property.name}`,
      body: body.visitor_message ?? 'Alguien tocó el timbre',
      url: '/dashboard',
    })

    // =========================================================
    // SEND PUSH
    // =========================================================
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
          payload
        )
      )
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('RINGS ERROR:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}