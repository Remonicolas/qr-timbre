'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

// Versión simplificada sin el hook usePWAInstall que puede causar problemas
export function PWAInstallBanner() {
  const [show, setShow] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)

  useEffect(() => {
    // Solo en producción
    if (process.env.NODE_ENV === 'development') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  const install = async () => {
    if (!installPrompt) return
    const prompt = installPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> }
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="rounded-2xl border border-border bg-card shadow-xl p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Instalá QR Bell</p>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
          </div>
          <div className="flex gap-2">
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-secondary">
              <X size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={install}
              className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Download size={12} />
              Instalar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
