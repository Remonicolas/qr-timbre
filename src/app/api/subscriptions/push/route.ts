import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const SubscriptionSchema = z.object({
  fcm_token: z.string().min(1),
  device_name: z.string().max(100).optional(),
  browser: z.string().max(50).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: z.infer<typeof SubscriptionSchema>

  try {
    const raw = await request.json() as unknown
    body = SubscriptionSchema.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        fcm_token: body.fcm_token,
        device_name: body.device_name ?? null,
        browser: body.browser ?? null,
        is_active: true,
      },
      { onConflict: 'user_id,fcm_token' }
    )

  if (error) {
    return NextResponse.json(
      { error: 'Error al guardar suscripción' },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { subscribed: true }, error: null })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { fcm_token } = await request.json() as { fcm_token: string }

  await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('fcm_token', fcm_token)

  return NextResponse.json({ data: { unsubscribed: true }, error: null })
}