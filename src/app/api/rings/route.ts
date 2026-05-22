import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { firebaseAdmin } from '@/lib/firebase-admin'

const RingSchema = z.object({
  qr_code: z.string(),
  visitor_category: z.enum(['delivery', 'guest', 'mail', 'emergency', 'other']),
  visitor_message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = RingSchema.parse(await req.json())

  const supabase = await createAdminClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, user_id, name, notification_push')
    .eq('qr_code', body.qr_code)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 🔥 obtener token
  const { data: tokens } = await supabase
    .from('push_subscriptions')
    .select('fcm_token')
    .eq('user_id', property.user_id)
    .eq('is_active', true)

  const fcmTokens = tokens?.map(t => t.fcm_token).filter(Boolean) ?? []

  if (fcmTokens.length > 0) {
    await firebaseAdmin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification: {
        title: `🔔 ${property.name}`,
        body: body.visitor_message ?? 'Alguien tocó el timbre',
      },
      data: {
        property_id: property.id,
      },
    })
  }

  return NextResponse.json({ ok: true })
}