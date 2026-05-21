// ============================================================
// QR BELL — Push Notification Prompt
// Shows contextual UI based on platform and install state
// ============================================================
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Loader2, Smartphone, Download, Settings } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { cn } from '@/utils/cn'

interface Props {
  /** Show as a full card (settings page) or compact banner */
  variant?: 'card' | 'banner'
  /** Called when user successfully subscribes */
  onSubscribed?: () => void
}

export function PushNotificationPrompt({ variant = 'card', onSubscribed }: Props) {
  const { state, isIOS, isStandalone, subscribe, unsubscribe, errorMessage } = usePushNotifications()

  const handleSubscribe = async () => {
    await subscribe()
    if (state === 'subscribed') onSubscribed?.()
  }

  // ── Loading ───────────────────────────────────────────────
  if (state === 'loading') {
    return variant === 'card' ? (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-3" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-10 w-full bg-muted rounded-xl mt-4" />
      </div>
    ) : null
  }

  // ── iOS but NOT installed ─────────────────────────────────
  if (isIOS && state === 'not_standalone') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border bg-gradient-to-br from-blue-500/10 to-primary/10 border-primary/20 p-5',
          variant === 'banner' && 'mx-4 mb-4'
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Instalá QR Bell para activar notificaciones</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Las notificaciones push en iPhone requieren que la app esté instalada.
            </p>
          </div>
        </div>

        {/* iOS install instructions */}
        <div className="mt-4 space-y-2">
          {[
            { step: '1', text: 'Tocá el botón compartir en Safari', icon: '⬆️' },
            { step: '2', text: 'Seleccioná "Agregar a pantalla de inicio"', icon: '📱' },
            { step: '3', text: 'Abrí QR Bell desde tu pantalla de inicio', icon: '🔔' },
          ].map(({ step, text, icon }) => (
            <div key={step} className="flex items-center gap-3 text-xs">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">
                {step}
              </div>
              <span className="text-muted-foreground">{icon} {text}</span>
            </div>
          ))}
        </div>

        {/* Visual arrow hint pointing to Safari share button */}
        <div className="flex justify-center mt-4">
          <div className="flex flex-col items-center gap-1 text-xs text-primary/60">
            <span>Tocá</span>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary" stroke="currentColor" strokeWidth={2}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Unsupported browser ───────────────────────────────────
  if (state === 'unsupported') {
    return variant === 'card' ? (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff size={18} />
          <div>
            <p className="text-sm font-medium">Notificaciones no disponibles</p>
            <p className="text-xs mt-0.5">Tu navegador no soporta notificaciones push.</p>
          </div>
        </div>
      </div>
    ) : null
  }

  // ── Already subscribed ────────────────────────────────────
  if (state === 'subscribed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Bell size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                ✓ Notificaciones activas
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recibirás alertas cuando toquen tu timbre
              </p>
            </div>
          </div>
          {variant === 'card' && (
            <button
              onClick={unsubscribe}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Desactivar
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Permission denied ─────────────────────────────────────
  if (state === 'denied') {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <BellOff size={18} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Notificaciones bloqueadas</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isIOS
                ? 'Habilitá las notificaciones en: Configuración → QR Bell → Notificaciones'
                : 'Hacé clic en el candado en la barra de URL y habilitá las notificaciones.'}
            </p>
            {isIOS && (
              <button
                className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                onClick={() => {/* iOS can't open settings programmatically */}}
              >
                <Settings size={12} />
                Ir a Configuración → QR Bell → Notificaciones
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
        <p className="text-sm text-destructive font-medium">
          ❌ {errorMessage ?? 'Error al activar notificaciones'}
        </p>
        <button
          onClick={handleSubscribe}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-all"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  // ── Idle / Ready to subscribe ─────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {isIOS && isStandalone && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <span>📱</span>
          <span>App instalada — podés activar notificaciones push de iOS</span>
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={state === 'subscribing'}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-bold transition-all',
          'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50',
          state === 'subscribing' && 'cursor-wait'
        )}
      >
        {state === 'subscribing' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Activando notificaciones...
          </>
        ) : (
          <>
            <Bell size={16} />
            Activar notificaciones push
          </>
        )}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        {isIOS
          ? 'Se abrirá un diálogo de iOS para confirmar los permisos'
          : 'El navegador te pedirá confirmar el permiso'}
      </p>
    </motion.div>
  )
}
