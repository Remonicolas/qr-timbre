import { createAdminClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin | QR Bell' }

export default async function AdminPage() {
  const supabase = await createAdminClient()

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: totalRingsToday },
    { data: planBreakdown },
  ] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('ring_events').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('user_profiles').select('subscription_plan'),
  ])

  const plans = planBreakdown?.reduce((acc: Record<string, number>, p) => {
    acc[p.subscription_plan] = (acc[p.subscription_plan] ?? 0) + 1
    return acc
  }, {}) ?? {}

  const stats = [
    { label: 'Usuarios totales', value: totalUsers ?? 0, icon: '👥' },
    { label: 'Propiedades', value: totalProperties ?? 0, icon: '🏠' },
    { label: 'Timbrazos hoy', value: totalRingsToday ?? 0, icon: '🔔' },
    { label: 'Plan Pro+', value: (plans['pro'] ?? 0) + (plans['business'] ?? 0), icon: '💳' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-bold mb-4">Distribución de planes</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(['free', 'pro', 'business'] as const).map((plan) => (
            <div key={plan} className="rounded-xl bg-secondary/50 p-4">
              <p className="font-display text-2xl font-bold">{plans[plan] ?? 0}</p>
              <p className="text-sm text-muted-foreground capitalize">{plan}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
