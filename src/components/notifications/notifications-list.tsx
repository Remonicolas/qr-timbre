'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import type { Notification } from '@/types'

const TYPE_EMOJI: Record<string, string> = {
  ring: '🔔', system: '⚙️', subscription: '💳', promo: '🎁',
}

interface Props { notifications: Notification[] }

export function NotificationsList({ notifications }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h3 className="font-display text-lg font-bold mb-2">Sin notificaciones</h3>
        <p className="text-muted-foreground text-sm">Tus alertas aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
      {notifications.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          className="flex items-start gap-4 p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
            {TYPE_EMOJI[n.type] ?? '📢'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{n.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
