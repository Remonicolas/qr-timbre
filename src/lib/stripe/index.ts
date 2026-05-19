// ============================================================
// QR BELL - Stripe Server Integration
// IMPORTANTE: Solo usar en API routes, nunca en Client Components
// ============================================================
import type { SubscriptionPlan } from '@/types'

export { PLAN_DISPLAY } from './plans'

// Lazy init — Stripe se instancia solo cuando se llama, no en build time
let _stripe: import('stripe').default | null = null

export async function getStripe() {
  if (!_stripe) {
    const Stripe = (await import('stripe')).default
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }
  return _stripe
}

// Para uso directo en archivos que ya son server-only (webhooks, etc.)
export const stripe = new Proxy({} as import('stripe').default, {
  get(_target, prop) {
    return async (...args: unknown[]) => {
      const s = await getStripe()
      const method = (s as unknown as Record<string, unknown>)[prop as string]
      if (typeof method === 'function') {
        return (method as (...a: unknown[]) => unknown).apply(s, args)
      }
      return method
    }
  },
})

export const STRIPE_PRICES: Record<SubscriptionPlan, { monthly?: string; yearly?: string }> = {
  free: {},
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
}

export async function createOrRetrieveCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const s = await getStripe()
  const supabase = await createAdminClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await s.customers.create({
    email,
    name: name ?? undefined,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const s = await getStripe()
  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { supabase_user_id: userId },
    subscription_data: {
      metadata: { supabase_user_id: userId },
      trial_period_days: 14,
    },
    allow_promotion_codes: true,
  })
  return session.url!
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const s = await getStripe()
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_YEARLY
  ) return 'pro'

  if (
    priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_BUSINESS_YEARLY
  ) return 'business'

  return 'free'
}

export function getMaxPropertiesForPlan(plan: SubscriptionPlan): number {
  return { free: 1, pro: 5, business: 50 }[plan]
}
