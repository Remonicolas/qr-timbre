// ============================================================
// QR BELL - Stripe Server-only Integration
// Este archivo solo se usa en API routes (server-side)
// ============================================================
import Stripe from 'stripe'
import type { SubscriptionPlan } from '@/types'

// Re-exportar constantes de display desde plans.ts
export { PLAN_DISPLAY } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
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
  const supabase = await createAdminClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({
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
  const session = await stripe.checkout.sessions.create({
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
    billing_address_collection: 'auto',
  })

  return session.url!
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
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
  const limits = { free: 1, pro: 5, business: 50 }
  return limits[plan]
}
