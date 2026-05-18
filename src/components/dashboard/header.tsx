'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/config/app'
import type { UserProfile } from '@/types'

interface Props {
  profile: UserProfile
}

export function DashboardHeader({ profile }: Props) {
  const { theme, setTheme } = useTheme()
  const [unreadCount, setUnreadCount] = useState(0)
  // FIX: usar ref para no recrear el cliente en cada render
  const supabaseRef = useRef(createClient())
  const subscribedRef = useRef(false)

  useEffect(() => {
    // FIX: evitar doble suscripción en StrictMode
    if (subscribedRef.current) return
    subscribedRef.current = true

    const supabase = supabaseRef.current

    // Contar no leídas
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Suscribir solo una vez
    const channel = supabase
      .channel('header-notifs-' + profile.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => setUnreadCount((prev) => prev + 1)
      )
      .subscribe()

    return () => {
      subscribedRef.current = false
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-xl">🔔</span>
        <span className="font-display font-bold gradient-text">QR Bell</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-secondary transition-all"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <Link
          href={ROUTES.notifications}
          className="relative p-2 rounded-xl hover:bg-secondary transition-all"
          aria-label="Notificaciones"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
