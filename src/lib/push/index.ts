// ============================================================
// QR BELL - Web Push Notification Service
// ============================================================
import webpush from 'web-push'
import type { VisitorCategory, Property } from '@/types'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string }>
  tag?: string
  requireInteraction?: boolean
  vibrate?: number[]
  sound?: string
}

export function buildRingPayload(
  property: Pick<Property, 'name' | 'id'>,
  category: VisitorCategory,
  message?: string | null,
  ringEventId?: string
): PushPayload {
  const categoryLabels: Record<VisitorCategory, string> = {
    delivery: '📦 Delivery',
    guest: '👤 Invitado',
    mail: '✉️ Correo',
    emergency: '🚨 Emergencia',
    other: '❓ Visita',
  }

  return {
    title: `🔔 ¡Timbre! - ${property.name}`,
    body: message
      ? `${categoryLabels[category]}: "${message}"`
      : `${categoryLabels[category]} tocó el timbre`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `ring-${property.id}`,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      type: 'ring',
      property_id: property.id,
      ring_event_id: ringEventId,
      url: '/dashboard',
    },
    actions: [
      { action: 'view', title: '👀 Ver' },
      { action: 'respond', title: '💬 Responder' },
    ],
  }
}

export async function sendPushNotification(
  subscription: {
    endpoint: string
    p256dh: string
    auth: string
  },
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour
        urgency: 'high',
      }
    )
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }

    // Subscription expired or invalid
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, error: 'SUBSCRIPTION_EXPIRED' }
    }

    console.error('Push notification error:', err)
    return { success: false, error: err.message ?? 'Unknown error' }
  }
}

export async function sendRingNotificationsToUser(
  userId: string,
  property: Pick<Property, 'id' | 'name'>,
  category: VisitorCategory,
  message?: string | null,
  ringEventId?: string
): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = await createAdminClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!subscriptions?.length) return

  const payload = buildRingPayload(property, category, message, ringEventId)

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  )

  // Deactivate expired subscriptions
  const expiredEndpoints: string[] = []
  results.forEach((result, index) => {
    if (
      result.status === 'fulfilled' &&
      result.value.error === 'SUBSCRIPTION_EXPIRED'
    ) {
      const sub = subscriptions[index]
      if (sub) expiredEndpoints.push(sub.endpoint)
    }
  })

  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .in('endpoint', expiredEndpoints)
  }
}
