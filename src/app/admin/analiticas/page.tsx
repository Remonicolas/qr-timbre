import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Analíticas Global | Admin QR Bell' }

export default async function AdminAnalyticsPage() {
  const supabase = await createAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: ringsTotal },
    { count: ringsMonth },
    { count: usersMonth },
    { data: topCategories },
  ] = await Promise.all([
    supabase.from('ring_events').select('id', { count: 'exact', head: true }),
    supabase.from('ring_events').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('ring_events').select('visitor_category').gte('created_at', thirtyDaysAgo),
  ])

  const categoryCounts = (topCategories ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.visitor_category] = (acc[r.visitor_category] ?? 0) + 1
    return acc
  }, {})

  const LABELS: Record<string, string> = {
    delivery: '📦 Delivery', guest: '👤 Invitado', mail: '✉️ Correo',
    emergency: '🚨 Emergencia', other: '❓ Otro',
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Analíticas Global</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Timbrazos totales', value: ringsTotal ?? 0, icon: '🔔' },
          { label: 'Timbrazos últimos 30d', value: ringsMonth ?? 0, icon: '📅' },
          { label: 'Nuevos usuarios 30d', value: usersMonth ?? 0, icon: '👤' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold mb-4">Categorías (últimos 30 días)</h3>
        <div className="space-y-3">
          {Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm">{LABELS[cat] ?? cat}</span>
                <span className="font-bold text-primary">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
