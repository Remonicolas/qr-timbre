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

    // =========================================================
    // 🔍 1. GET PROPERTY
    // =========================================================
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id, name')
      .eq('qr_code', body.qr_code)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // =========================================================
    // 🔔 2. SAVE RING EVENT
    // =========================================================
    const { error: ringError } = await supabase
      .from('ring_events')
      .insert({
        property_id: property.id,
        visitor_category: body.visitor_category,
        visitor_message: body.visitor_message ?? null,
        status: 'pending',
      })

    if (ringError) {
      console.error('❌ RING EVENT ERROR:', ringError)

      return NextResponse.json(
        { error: 'Failed to create ring event' },
        { status: 500 }
      )
    }

    // =========================================================
    // 📲 3. GET ACTIVE TOKENS
    // =========================================================
    const { data: tokensData } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', property.user_id)
      .eq('is_active', true)

    const tokens =
      (tokensData ?? [])
        .map((t) => t.fcm_token)
        .filter(Boolean)

    console.log('📲 TOKENS COUNT:', tokens.length)

    // =========================================================
    // 🚀 4. SEND PUSH (PRODUCTION SAFE)
    // =========================================================
    if (tokens.length > 0) {
      try {
        const message = {
          tokens,

          // =====================================================
          // 📢 MAIN NOTIFICATION (ALL DEVICES)
          // =====================================================
          notification: {
            title: `🔔 ${property.name}`,
            body:
              body.visitor_message ??
              'Alguien tocó el timbre',
          },

          // =====================================================
          // 📦 DATA PAYLOAD (FOR NAVIGATION)
          // =====================================================
          data: {
            property_id: property.id,
            url: '/dashboard',
            type: 'ring_event',
            timestamp: Date.now().toString(),
          },

          // =====================================================
          // 🤖 ANDROID (HIGH PRIORITY PUSH)
          // =====================================================
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'ring-events',
            },
          },

          // =====================================================
          // 🍎 iOS (APNs - CRITICAL FIX)
          // =====================================================
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                alert: {
                  title: `🔔 ${property.name}`,
                  body:
                    body.visitor_message ??
                    'Alguien tocó el timbre',
                },
                sound: 'default',
                badge: 1,

                // 🔥 esto mantiene app viva en background
                'content-available': 1,
              },
            },
          },

          // =====================================================
          // 🌐 WEB PUSH (SW CONTROL)
          // =====================================================
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
              tag: 'ring-event',
            },
            fcmOptions: {
              link: '/dashboard',
            },
          },
        }

        const response =
          await firebaseAdmin.messaging().sendEachForMulticast(message)

        console.log('✅ PUSH SENT:', {
          success: response.successCount,
          failure: response.failureCount,
        })

        // =====================================================
        // ❌ HANDLE FAILED TOKENS (PRODUCTION CLEANUP)
        // =====================================================
        if (response.failureCount > 0) {
          const failedTokens: string[] = []

          response.responses.forEach((res, idx) => {
            if (!res.success) {
              failedTokens.push(tokens[idx])
            }
          })

          console.log('❌ FAILED TOKENS:', failedTokens)

          // desactivar tokens inválidos
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .in('fcm_token', failedTokens)
        }
      } catch (pushError) {
        console.error('🔥 PUSH ERROR:', pushError)
      }
    }

    // =========================================================
    // RESPONSE
    // =========================================================
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