import { webpush } from '@/lib/webpush'

export async function sendPushToUsers(
  subscriptions: {
    endpoint: string
    p256dh: string
    auth: string
  }[],
  payload: {
    title: string
    body: string
    url?: string
  }
) {
  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/dashboard',
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        message
      )
    )
  )

  return results
}