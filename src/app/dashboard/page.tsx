import { createClient } from '@/lib/supabase/server'
import { DashboardOverview } from '@/components/dashboard/overview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: properties },
    { data: recentRings },
  ] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('properties')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('ring_events')
      .select('*, property:properties(name, type)')
      .in(
        'property_id',
        (
          await supabase
            .from('properties')
            .select('id')
            .eq('user_id', user!.id)
        ).data?.map((p) => p.id) ?? []
      )
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <DashboardOverview
      profile={profile!}
      properties={properties ?? []}
      recentRings={recentRings ?? []}
    />
  )
}
