import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimitRing, rateLimitResponse, getRequestIdentifier } from '@/lib/rate-limit'
import { firebaseAdmin } from '@/lib/firebase-admin'

const RingSchema = z.object({
  qr_code: z.string().min(1).max(100),
  visitor_category: z.enum(['delivery', 'guest', 'mail', 'emergency', 'other']).default('guest'),
  visitor_message: z.string().max(150).optional(),
  unit_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const ip = getRequestIdentifier(request)
  const limitResult = await rateLimitRing(ip)

  if (!limitResult.success) {
    return rateLimitResponse(limitResult)
  }

  const body = RingSchema.parse(await request.json())

  const supabase = await createAdminClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, user_id, name, notification_push')
    .eq('qr_code', body.qr_code)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const message = {
    notification: {
      title: `🔔 ${property.name}`,
      body: body.visitor_message ?? 'Alguien tocó el timbre',
    },
    data: {
      property_id: property.id,
    },
  }

  if (property.notification_push) {
    // Firebase Admin push
    await firebaseAdmin.messaging().sendToTopic(property.user_id, message)
  }

  return NextResponse.json({ ok: true })
}