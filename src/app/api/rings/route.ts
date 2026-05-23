import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { firebaseAdmin } from '@/lib/firebase-admin'

const RingSchema = z.object({
  qr_code: z.string(),
  visitor_category: z
    .enum(['delivery', 'guest', 'mail', 'emergency', 'other'])
    .default('guest'),
  visitor_message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = RingSchema.parse(await req.json())

    const supabase = await createAdminClient()

    // 🔍 buscar propiedad
    const { data: property } = await supabase
      .from('properties')
      .select('id, user_id, name')
      .eq('qr_code', body.qr_code)
      .single()

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // 🔔 guardar evento del timbre
    const { error: ringError } = await supabase
      .from('ring_events')
      .insert({
        property_id: property.id,
        visitor_category: body.visitor_category,
        visitor_message: body.visitor_message ?? null,
        status: 'pending',
      })

    if (ringError) {
      console.error('RING EVENT ERROR:', ringError)

      return NextResponse.json(
        { error: 'Failed to create ring event' },
        { status: 500 }
      )
    }

    // 📲 obtener tokens FCM
    const { data: tokensData } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', property.user_id)
      .eq('is_active', true)

    const tokens =
      tokensData
        ?.map((t) => t.fcm_token)
        .filter(Boolean) ?? []

    console.log('📲 TOKENS:', tokens)

    // 🔥 enviar push SIN romper endpoint
    try {
      if (tokens.length > 0) {
        const response =
          await firebaseAdmin.messaging().sendEachForMulticast({
            tokens,

            notification: {
              title: `🔔 ${property.name}`,
              body:
                body.visitor_message ??
                'Alguien tocó el timbre',
            },

            webpush: {
              headers: {
                Urgency: 'high',
              },

              notification: {
                title: `🔔 ${property.name}`,
                body:
                  body.visitor_message ??
                  'Alguien tocó el timbre',

                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',

                requireInteraction: true,

                vibrate: [200, 100, 200],
              },

              fcmOptions: {
                link: '/dashboard',
              },
            },

            data: {
              property_id: property.id,
              click_action: '/dashboard',
            },
          })

        console.log('✅ FCM RESPONSE:', response)
      }
    } catch (fcmError) {
      console.error('🔥 FCM ERROR:', fcmError)
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (err) {
    console.error('❌ RINGS API ERROR:', err)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}