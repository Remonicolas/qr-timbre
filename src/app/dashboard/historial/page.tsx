import { createClient } from '@/lib/supabase/server'
import { RingHistoryList } from '@/components/dashboard/ring-history'

export const metadata = { title: 'Historial | QR Bell' }

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: propertyIds } = await supabase
    .from('properties').select('id').eq('user_id', user!.id)

  const ids = propertyIds?.map((p) => p.id) ?? []

  const { data: rings } = ids.length
    ? await supabase
        .from('ring_events')
        .select('*, property:properties(name, type, unit_number)')
        .in('property_id', ids)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Historial de Timbrazos</h1>
        <p className="text-muted-foreground text-sm mt-1">{rings?.length ?? 0} registros</p>
      </div>
      <RingHistoryList rings={rings ?? []} />
    </div>
  )
}
