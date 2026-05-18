import { createClient } from '@/lib/supabase/server'
import { DashboardOverview } from '@/components/dashboard/overview'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/config/app'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.login)

  // Traer perfil y propiedades en paralelo
  const [{ data: profile }, { data: properties }] = await Promise.all([
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
  ])

  // Traer rings solo si hay propiedades (evita error con .in() vacío)
  const propertyIds = (properties ?? []).map((p) => p.id)
  const { data: recentRings } = propertyIds.length > 0
    ? await supabase
        .from('ring_events')
        .select('*, property:properties(name, type)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] }

  // Perfil de fallback si por alguna razón no existe
  const safeProfile = profile ?? {
    id: user!.id,
    email: user!.email ?? '',
    full_name: user!.user_metadata?.full_name ?? null,
    avatar_url: user!.user_metadata?.avatar_url ?? null,
    phone: null,
    role: 'user' as const,
    subscription_plan: 'free' as const,
    subscription_status: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    max_properties: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <DashboardOverview
      profile={safeProfile}
      properties={properties ?? []}
      recentRings={recentRings ?? []}
    />
  )
}
