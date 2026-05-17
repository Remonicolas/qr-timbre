import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  fcm_token: z.string().optional(),
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

  // Upsert subscription
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        fcm_token: body.fcm_token ?? null,
        device_name: body.device_name ?? null,
        browser: body.browser ?? null,
        is_active: true,
      },
      { onConflict: 'user_id,endpoint' }
    )

  if (error) {
    return NextResponse.json({ error: 'Error al guardar suscripción' }, { status: 500 })
  }

  return NextResponse.json({ data: { subscribed: true }, error: null })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { endpoint } = await request.json() as { endpoint: string }

  await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  return NextResponse.json({ data: { unsubscribed: true }, error: null })
}
