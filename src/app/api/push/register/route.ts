import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { firebaseAdmin } from '@/lib/firebase-admin'

const RingSchema = z.object({
  qr_code: z.string().min(1).max(100),
  visitor_category: z.enum(['delivery', 'guest', 'mail', 'emergency', 'other']).default('guest'),
  visitor_message: z.string().max(150).optional(),
  unit_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = RingSchema.parse(await request.json())

    const supabase = await createAdminClient()

    // 1. Buscar propiedad
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, user_id, name, notification_push')
      .eq('qr_code', body.qr_code)
      .eq('is_active', true)
      .single()

    if (propError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // 2. Guardar ring event
    const { data: ringEvent, error: ringError } = await supabase
      .from('ring_events')
      .insert({
        property_id: property.id,
        visitor_category: body.visitor_category,
        visitor_message: body.visitor_message ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (ringError) {
      console.error('Ring insert error:', ringError)
      return NextResponse.json(
        { error: 'DB error' },
        { status: 500 }
      )
    }

    // 3. Obtener tokens FCM
    const { data: tokens } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', property.user_id)
      .eq('is_active', true)

    const fcmTokens =
      tokens?.map(t => t.fcm_token).filter(Boolean) ?? []

    // 4. Enviar push si hay tokens
    if (property.notification_push && fcmTokens.length > 0) {
      try {
        await firebaseAdmin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: {
            title: `🔔 ${property.name}`,
            body: body.visitor_message ?? 'Alguien tocó el timbre',
          },
          data: {
            property_id: property.id,
            ring_event_id: ringEvent.id,
            category: body.visitor_category,
          },
        })
      } catch (err) {
        console.error('FCM send error:', err)
      }
    }

    return NextResponse.json({
      ok: true,
      ring_id: ringEvent.id,
    })
  } catch (err) {
    console.error('Rings error:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}