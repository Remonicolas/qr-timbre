import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/dashboard/analytics'

export const metadata = { title: 'Analíticas | QR Bell' }

export default async function AnaliticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: properties } = await supabase
    .from('properties').select('id, name').eq('user_id', user!.id)

  const { data: summary } = await supabase
    .rpc('get_analytics_summary', { p_user_id: user!.id })

  const firstPropId = properties?.[0]?.id

  const [{ data: byHour }, { data: byDay }] = await Promise.all([
    firstPropId
      ? supabase.rpc('get_rings_by_hour', { p_property_id: firstPropId, p_days: 30 })
      : { data: [] },
    firstPropId
      ? supabase.rpc('get_rings_by_day', { p_property_id: firstPropId, p_days: 30 })
      : { data: [] },
  ])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Analíticas</h1>
        <p className="text-muted-foreground text-sm mt-1">Actividad de tus timbres</p>
      </div>
      <AnalyticsDashboard
        summary={summary?.[0] ?? null}
        byHour={(byHour as Array<{ hour: number; count: number }>) ?? []}
        byDay={(byDay as Array<{ date: string; count: number }>) ?? []}
        properties={properties ?? []}
      />
    </div>
  )
}
