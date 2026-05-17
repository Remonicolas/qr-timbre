import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrRetrieveCustomer, createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe'
import { APP_CONFIG, ROUTES } from '@/config/app'
import type { SubscriptionPlan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { plan, billing } = await request.json() as { plan: SubscriptionPlan; billing: 'monthly' | 'yearly' }
  const prices = STRIPE_PRICES[plan]
  const priceId = billing === 'yearly' ? prices.yearly : prices.monthly

  if (!priceId) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })

  const { data: profile } = await supabase.from('user_profiles').select('email, full_name').eq('id', user.id).single()
  const customerId = await createOrRetrieveCustomer(user.id, profile!.email, profile?.full_name ?? undefined)

  const url = await createCheckoutSession(
    customerId,
    priceId,
    user.id,
    `${APP_CONFIG.url}${ROUTES.billing}?success=1`,
    `${APP_CONFIG.url}${ROUTES.billing}`
  )

  return NextResponse.json({ url })
}
