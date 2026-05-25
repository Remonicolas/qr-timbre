import * as webpush from 'web-push'
const subject =
  process.env.VAPID_SUBJECT?.startsWith('mailto:')
    ? process.env.VAPID_SUBJECT
    : `mailto:${process.env.VAPID_SUBJECT}`

webpush.setVapidDetails(
  subject!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export { webpush }