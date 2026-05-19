import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/app'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const { createPortalSession } = await import('@/lib/stripe')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.billing}`
    const url = await createPortalSession(profile.stripe_customer_id, returnUrl)

    return NextResponse.json({ url, error: null })
  } catch (err) {
    console.error('[Portal] Error:', err)
    return NextResponse.json({ error: 'Error al abrir portal' }, { status: 500 })
  }
}
