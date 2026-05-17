'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share } from 'lucide-react'
import { usePWAInstall } from '@/hooks'

export function PWAInstallBanner() {
  const { canInstall, promptInstall } = usePWAInstall()
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if iOS Safari and not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed') === 'true'

    if (isIOS && !isStandalone && !wasDismissed) {
      // Delay showing for better UX
      setTimeout(() => setShowIOSBanner(true), 3000)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
    setShowIOSBanner(false)
  }

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) dismiss()
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {/* Android/Desktop Install Banner */}
      {canInstall && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        >
          <div className="mx-4 mb-4 rounded-2xl border border-border bg-card shadow-xl shadow-black/20 p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Instalá QR Bell</p>
                <p className="text-xs text-muted-foreground">
                  Acceso rápido y notificaciones en tu pantalla de inicio
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={dismiss}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-all"
                  aria-label="Cerrar"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                >
                  <Download size={13} />
                  Instalar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS Safari Instructions */}
      {showIOSBanner && !canInstall && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
        >
          <div className="mx-4 mb-4 rounded-2xl border border-border bg-card shadow-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <p className="font-semibold text-sm">Instalá QR Bell en iPhone</p>
              </div>
              <button onClick={dismiss} className="p-1 rounded-lg hover:bg-secondary" aria-label="Cerrar">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                <span>Tocá el botón Compartir</span>
                <Share size={13} className="text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span>
                <span>Seleccioná &ldquo;Agregar a pantalla de inicio&rdquo;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</span>
                <span>Tocá &ldquo;Agregar&rdquo; para confirmar</span>
              </div>
            </div>
            {/* iOS Home Indicator Arrow */}
            <div className="flex justify-center mt-3">
              <div className="w-2 h-2 border-r-2 border-b-2 border-primary rotate-45 animate-bounce" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
