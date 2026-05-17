'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Home,
  Bell,
  History,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/config/app'
import type { UserProfile } from '@/types'
import { cn } from '@/utils/cn'

interface Props {
  profile: UserProfile
}

const navItems = [
  { href: ROUTES.dashboard, label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/propiedades', label: 'Propiedades', icon: Home },
  { href: '/dashboard/historial', label: 'Historial', icon: History },
  { href: '/dashboard/analiticas', label: 'Analíticas', icon: BarChart3 },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/suscripcion', label: 'Suscripción', icon: CreditCard },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
]

const PLAN_COLORS = {
  free: 'bg-slate-500/10 text-slate-500',
  pro: 'bg-blue-500/10 text-blue-500',
  business: 'bg-purple-500/10 text-purple-500',
}

const PLAN_LABELS = {
  free: 'Gratis',
  pro: 'Pro',
  business: 'Business',
}

export function DashboardSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(ROUTES.login)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <span className="text-2xl">🔔</span>
          <span className="font-display text-xl font-bold gradient-text">QR Bell</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon size={18} className={isActive ? 'text-primary' : ''} />
                {item.label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-primary/50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {profile.full_name?.[0]?.toUpperCase() ?? profile.email[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile.full_name ?? 'Usuario'}
              </p>
              <div className={cn('inline-flex text-xs px-2 py-0.5 rounded-full font-medium', PLAN_COLORS[profile.subscription_plan])}>
                {PLAN_LABELS[profile.subscription_plan]}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom glass border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
