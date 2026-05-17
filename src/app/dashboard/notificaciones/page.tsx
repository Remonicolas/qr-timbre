import { createClient } from '@/lib/supabase/server'
import { NotificationsList } from '@/components/notifications/notifications-list'

export const metadata = { title: 'Notificaciones | QR Bell' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Mark all as read
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">{notifications?.length ?? 0} notificaciones</p>
      </div>
      <NotificationsList notifications={notifications ?? []} />
    </div>
  )
}
