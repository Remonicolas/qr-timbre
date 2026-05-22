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
  try {
    const ip = getRequestIdentifier(request)
    const limitResult = await rateLimitRing(ip)

    if (!limitResult.success) {
      return rateLimitResponse(limitResult)
    }

    const body = RingSchema.parse(await request.json())

    const supabase = await createAdminClient()

    // 1. buscar propiedad
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, user_id, name, notification_push')
      .eq('qr_code', body.qr_code)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    // 2. payload push
    const message = {
      notification: {
        title: `🔔 ${property.name}`,
        body: body.visitor_message ?? 'Alguien tocó el timbre',
      },
      data: {
        property_id: property.id,
      },
    }

    // 3. enviar push (CORRECTO)
    if (property.notification_push) {
      await firebaseAdmin.messaging().send({
        topic: `user_${property.user_id}`,
        notification: message.notification,
        data: message.data,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('RINGS ERROR:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}