import { createAdminClient } from '@/lib/supabase/server'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '@/types'

export const metadata = { title: 'Propiedades | Admin QR Bell' }

export default async function AdminPropertiesPage() {
  const supabase = await createAdminClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('*, user:user_profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Propiedades ({properties?.length ?? 0})</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {['Propiedad', 'Tipo', 'Estado', 'Propietario', 'QR Code'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {properties?.map((p) => {
                const user = p.user as { email?: string; full_name?: string } | null
                return (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{PROPERTY_TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{PROPERTY_STATUS_LABELS[p.status]}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user?.email ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.qr_code.slice(0, 16)}...</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
