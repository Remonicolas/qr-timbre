'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/config/app'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[QRBell Error]', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">Algo salió mal</h1>
          <p className="text-muted-foreground text-sm">
            Ocurrió un error inesperado. El equipo fue notificado.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs font-mono text-muted-foreground">
              ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            Intentar de nuevo
          </button>
          <Link
            href={ROUTES.dashboard}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary transition-all"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
