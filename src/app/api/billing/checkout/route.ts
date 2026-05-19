import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { APP_CONFIG, ROUTES } from '@/config/app'
import type { SubscriptionPlan } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Todo dentro del handler — nada se ejecuta en build time
    const { createClient: createAdminClient } = await import('@/lib/supabase/server')
    const { createOrRetrieveCustomer, createCheckoutSession, STRIPE_PRICES } = await import('@/lib/stripe')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json() as { plan: SubscriptionPlan; billing: 'monthly' | 'yearly' }
    const { plan, billing } = body

    const prices = STRIPE_PRICES[plan]
    if (!prices) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const priceId = billing === 'yearly' ? prices.yearly : prices.monthly
    if (!priceId) {
      return NextResponse.json({ error: 'Precio no configurado' }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()
    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 400 })
    }

    const customerId = await createOrRetrieveCustomer(
      user.id,
      profile.email,
      profile.full_name ?? undefined
    )

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.billing}?success=1`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.billing}`

    const url = await createCheckoutSession(
      customerId,
      priceId,
      user.id,
      successUrl,
      cancelUrl
    )

    return NextResponse.json({ url, error: null })
  } catch (err) {
    console.error('[Checkout] Error:', err)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    )
  }
}
