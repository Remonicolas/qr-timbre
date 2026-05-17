import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'
import { APP_CONFIG, ROUTES } from '@/config/app'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).single()
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 })

  const url = await createPortalSession(profile.stripe_customer_id, `${APP_CONFIG.url}${ROUTES.billing}`)
  return NextResponse.json({ url })
}
