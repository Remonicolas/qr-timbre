'use client'

import { useState, useEffect } from 'react'
import { Bell, Moon, Sun, Menu } from 'lucide-react'
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
  const supabase = createClient()

  useEffect(() => {
    // Get initial count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-xl">🔔</span>
        <span className="font-display font-bold gradient-text">QR Bell</span>
      </div>

      <div className="hidden md:block">
        {/* Page title will be set by child pages */}
      </div>

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
