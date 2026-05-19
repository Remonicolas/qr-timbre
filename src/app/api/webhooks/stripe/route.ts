import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { stripe, getPlanFromPriceId, getMaxPropertiesForPlan } = await import('@/lib/stripe')
    const { createAdminClient } = await import('@/lib/supabase/server')
    const type = await import('stripe')

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          id: string
          status: string
          metadata: Record<string, string>
          items: { data: Array<{ price: { id: string } }> }
        }
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
        const subscription = event.data.object as {
          metadata: Record<string, string>
        }
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

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'subscription',
          title: 'Suscripción cancelada',
          body: 'Tu suscripción fue cancelada. Pasaste al plan gratuito.',
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { customer: string }
        const customerId = invoice.customer

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
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
