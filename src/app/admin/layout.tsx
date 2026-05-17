import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/app'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) redirect(ROUTES.dashboard)

  const navItems = [
    { href: ROUTES.admin, label: '📊 Overview' },
    { href: ROUTES.adminUsers, label: '👥 Usuarios' },
    { href: ROUTES.adminProperties, label: '🏠 Propiedades' },
    { href: ROUTES.adminAnalytics, label: '📈 Analíticas' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card px-6 py-3 flex items-center gap-6">
        <span className="font-display font-bold text-red-500 text-sm">🔐 Admin Panel</span>
        {navItems.map((n) => (
          <Link key={n.href} href={n.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{n.label}</Link>
        ))}
        <Link href={ROUTES.dashboard} className="ml-auto text-xs text-muted-foreground hover:text-foreground">← App</Link>
      </nav>
      <main className="container mx-auto max-w-7xl p-6">{children}</main>
    </div>
  )
}
