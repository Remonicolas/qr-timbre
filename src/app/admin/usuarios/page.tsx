import { createAdminClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const metadata = { title: 'Usuarios | Admin QR Bell' }

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Usuarios ({users?.length ?? 0})</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {['Usuario', 'Email', 'Plan', 'Estado', 'Registro'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {u.full_name?.[0]?.toUpperCase() ?? u.email[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.subscription_plan === 'business' ? 'bg-purple-500/10 text-purple-600' :
                      u.subscription_plan === 'pro' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>{u.subscription_plan}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.subscription_status ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
