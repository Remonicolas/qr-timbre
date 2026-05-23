'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PushNotificationPrompt } from './push-notification-prompt'
import { useFirebasePush } from '@/hooks/use-firebase-push'

const STORAGE_KEY = 'qrbell-push-onboarding-dismissed'

export function PushOnboardingBanner() {
  const { permission, isSupported } = useFirebasePush()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isSupported) return
    if (permission === 'granted' || permission === 'denied') return
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [permission, isSupported])

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-bottom px-4 pb-4 md:left-auto md:right-4 md:bottom-4 md:w-96 md:px-0 md:pb-0"
        >
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <p className="font-semibold text-sm">
                  Activar notificaciones
                </p>
              </div>

              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-secondary transition-all"
              >
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sabé al instante cuando alguien toca tu timbre,
                incluso con la app cerrada.
              </p>

              <PushNotificationPrompt />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}