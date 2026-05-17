import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimitRing, rateLimitResponse, getRequestIdentifier } from '@/lib/rate-limit'
import { sendRingNotificationsToUser } from '@/lib/push'
import type { RingPayload } from '@/types'

const RingSchema = z.object({
  qr_code: z.string().min(1).max(100),
  visitor_category: z.enum(['delivery', 'guest', 'mail', 'emergency', 'other']).default('guest'),
  visitor_message: z.string().max(150).optional(),
  unit_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = getRequestIdentifier(request)
  const limitResult = await rateLimitRing(ip)

  if (!limitResult.success) {
    return rateLimitResponse(limitResult)
  }

  // Parse body
  let body: RingPayload
  try {
    const raw = await request.json() as unknown
    body = RingSchema.parse(raw)
  } catch {
    return NextResponse.json(
      { error: 'Datos inválidos', code: 'INVALID_PAYLOAD' },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()

  // Get property by QR code (never expose phone_number)
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, user_id, name, status, notification_push, notification_email, cooldown_seconds, is_active, is_building_mode')
    .eq('qr_code', body.qr_code)
    .eq('is_active', true)
    .single()

  if (propError || !property) {
    return NextResponse.json(
      { error: 'Timbre no encontrado', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Check "Do Not Disturb"
  if (property.status === 'do_not_disturb') {
    return NextResponse.json(
      { error: 'El residente activó No Molestar', code: 'DO_NOT_DISTURB' },
      { status: 403 }
    )
  }

  // Per-property cooldown check
  const { data: recentRing } = await supabase
    .from('ring_events')
    .select('created_at')
    .eq('property_id', property.id)
    .gte('created_at', new Date(Date.now() - property.cooldown_seconds * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentRing) {
    return NextResponse.json(
      { error: 'Demasiados timbrazos. Esperá un momento.', code: 'COOLDOWN' },
      { status: 429 }
    )
  }

  // Validate unit if building mode
  if (property.is_building_mode && body.unit_id) {
    const { data: unit } = await supabase
      .from('building_units')
      .select('id')
      .eq('id', body.unit_id)
      .eq('property_id', property.id)
      .eq('is_active', true)
      .single()

    if (!unit) {
      return NextResponse.json(
        { error: 'Unidad no válida', code: 'INVALID_UNIT' },
        { status: 400 }
      )
    }
  }

  // Create ring event
  const visitorIp = ip.substring(0, 45) // Truncate for IPv6
  const { data: ringEvent, error: ringError } = await supabase
    .from('ring_events')
    .insert({
      property_id: property.id,
      visitor_category: body.visitor_category,
      visitor_message: body.visitor_message ?? null,
      visitor_ip: visitorIp,
      status: 'pending',
    })
    .select('id')
    .single()

  if (ringError || !ringEvent) {
    console.error('Ring insert error:', ringError)
    return NextResponse.json(
      { error: 'Error al enviar el timbre', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  // Create in-app notification
  const categoryLabels = {
    delivery: 'Delivery',
    guest: 'Invitado',
    mail: 'Correo',
    emergency: 'Emergencia',
    other: 'Visita',
  }
  const categoryLabel = categoryLabels[body.visitor_category]

  await supabase.from('notifications').insert({
    user_id: property.user_id,
    type: 'ring',
    title: `🔔 ${property.name}`,
    body: body.visitor_message
      ? `${categoryLabel}: "${body.visitor_message}"`
      : `${categoryLabel} tocó el timbre`,
    ring_event_id: ringEvent.id,
    data: {
      property_id: property.id,
      ring_event_id: ringEvent.id,
      category: body.visitor_category,
    },
  })

  // Send push notifications (non-blocking)
  if (property.notification_push) {
    sendRingNotificationsToUser(
      property.user_id,
      { id: property.id, name: property.name },
      body.visitor_category,
      body.visitor_message,
      ringEvent.id
    ).catch((err: unknown) => console.error('Push notification failed:', err))
  }

  return NextResponse.json(
    {
      data: { id: ringEvent.id, message: '¡Timbre enviado!' },
      error: null,
    },
    { status: 201 }
  )
}
