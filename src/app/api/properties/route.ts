import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getRequestIdentifier } from '@/lib/rate-limit'
import crypto from 'crypto'

const PropertySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['house', 'apartment', 'office', 'store', 'other']).default('apartment'),
  unit_number: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  phone_number: z.string().max(20).optional(),
  status: z.enum(['available', 'busy', 'sleeping', 'do_not_disturb', 'away']).default('available'),
  is_building_mode: z.boolean().default(false),
  notification_email: z.boolean().default(true),
  notification_push: z.boolean().default(true),
  notification_sound: z.boolean().default(true),
  cooldown_seconds: z.number().min(0).max(3600).default(60),
  qr_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1a1a2e'),
  qr_bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Error al obtener propiedades', data: null }, { status: 500 })
  }

  return NextResponse.json({ data: properties, error: null })
}

export async function POST(request: NextRequest) {
  const ip = getRequestIdentifier(request)
  const limitResult = await rateLimit(ip, { limit: 10, windowMs: 60000, prefix: 'prop_create' })

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Check property limit based on plan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('max_properties')
    .eq('id', user.id)
    .single()

  const { count } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= (profile?.max_properties ?? 1)) {
    return NextResponse.json(
      {
        error: `Límite de propiedades alcanzado. Actualizá tu plan para agregar más.`,
        code: 'LIMIT_REACHED',
      },
      { status: 403 }
    )
  }

  let body: z.infer<typeof PropertySchema>
  try {
    const raw = await request.json() as unknown
    body = PropertySchema.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Datos inválidos', code: 'INVALID_PAYLOAD' }, { status: 400 })
  }

  const qrCode = crypto.randomBytes(16).toString('hex')

  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      user_id: user.id,
      qr_code: qrCode,
      ...body,
    })
    .select()
    .single()

  if (error) {
    console.error('Property create error:', error)
    return NextResponse.json({ error: 'Error al crear la propiedad', data: null }, { status: 500 })
  }

  return NextResponse.json({ data: property, error: null }, { status: 201 })
}
