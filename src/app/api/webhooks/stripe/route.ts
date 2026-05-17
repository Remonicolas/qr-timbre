import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanFromPriceId, getMaxPropertiesForPlan } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata['supabase_user_id']

        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        if (!priceId) break

        const plan = getPlanFromPriceId(priceId)
        const maxProperties = getMaxPropertiesForPlan(plan)

        await supabase
          .from('user_profiles')
          .update({
            subscription_plan: plan,
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
            max_properties: maxProperties,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata['supabase_user_id']

        if (!userId) break

        await supabase
          .from('user_profiles')
          .update({
            subscription_plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            max_properties: 1,
          })
          .eq('id', userId)

        // Notify user
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'subscription',
          title: 'Suscripción cancelada',
          body: 'Tu suscripción fue cancelada. Pasaste al plan gratuito.',
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id)

          await supabase.from('notifications').insert({
            user_id: profile.id,
            type: 'subscription',
            title: 'Pago fallido',
            body: 'No pudimos procesar tu pago. Actualizá tu método de pago.',
          })
        }
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        const userId = customer.metadata['supabase_user_id']

        if (userId) {
          await supabase
            .from('user_profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
