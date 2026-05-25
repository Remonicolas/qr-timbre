'use client'

import { motion } from 'framer-motion'
import { Bell, BellOff, Loader2, Smartphone, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useFirebasePush, PushState } from '@/hooks/use-firebase-push'
import { cn } from '@/utils/cn'

interface Props {
  variant?: 'card' | 'banner'
  onSubscribed?: () => void
}

export function PushNotificationPrompt({
  variant = 'card',
  onSubscribed,
}: Props) {
  const {
    state,
    isIOS,
    isStandalone,
    subscribe,
    unsubscribe,
    errorMessage,
  } = useFirebasePush()

  // =========================================================
  // FIX: reacción automática cuando se suscribe
  // =========================================================
  useEffect(() => {
    if (state === 'subscribed') {
      onSubscribed?.()
    }
  }, [state, onSubscribed])

  // =========================================================
  // SUBSCRIBE HANDLER (YA NO DEPENDE DE RETURN)
  // =========================================================
  const handleSubscribe = async () => {
    await subscribe()
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

  // ── Unsupported ───────────────────────────────────────────
  if (state === 'unsupported') {
    return (
      <div className="rounded-2xl border p-5 text-muted-foreground">
        <BellOff size={18} />
        <p className="text-sm mt-2">
          Tu navegador no soporta notificaciones
        </p>
      </div>
    )
  }

  // ── Subscribed ────────────────────────────────────────────
  if (state === 'subscribed') {
    return (
      <motion.div className="rounded-2xl border bg-green-500/10 p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-green-600">
              ✓ Notificaciones activas
            </p>
            <p className="text-xs text-muted-foreground">
              Recibirás alertas del timbre
            </p>
          </div>

          {variant === 'card' && (
            <button
              onClick={unsubscribe}
              className="text-xs text-muted-foreground hover:text-red-500"
            >
              Desactivar
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Denied ────────────────────────────────────────────────
  if (state === 'denied') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-600">
          Notificaciones bloqueadas
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          Tenés que habilitarlas manualmente en el navegador
        </p>

        {isIOS && (
          <button className="mt-2 text-xs text-blue-600 flex items-center gap-1">
            <Settings size={12} />
            Ver configuración iOS
          </button>
        )}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-600">
          ❌ {errorMessage ?? 'Error al activar notificaciones'}
        </p>

        <button
          onClick={handleSubscribe}
          className="mt-3 w-full rounded-xl bg-primary text-white py-2 text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  // ── Idle / Default ────────────────────────────────────────
  return (
    <motion.div className="space-y-3">
      {isIOS && isStandalone && (
        <div className="text-xs bg-blue-500/10 p-2 rounded-xl">
          📱 App instalada — podés activar notificaciones
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={state === 'subscribing'}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold',
          'bg-primary text-white',
          state === 'subscribing' && 'opacity-50'
        )}
      >
        {state === 'subscribing' ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Activando...
          </>
        ) : (
          <>
            <Bell size={16} />
            Activar notificaciones push
          </>
        )}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        El navegador te pedirá permiso
      </p>
    </motion.div>
  )
}