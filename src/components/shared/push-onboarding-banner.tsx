'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PushNotificationPrompt } from './push-notification-prompt'
import { useFirebasePush } from '@/hooks/use-firebase-push'

const STORAGE_KEY = 'qrbell-push-onboarding-dismissed'

export function PushOnboardingBanner() {
  const { state } = useFirebasePush()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (state === 'subscribed' || state === 'denied') return
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [state])

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
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-white border rounded-xl p-4 shadow-xl">
            <div className="flex justify-between">
              <p>🔔 Activar notificaciones</p>
              <button onClick={dismiss}>
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Te avisamos cuando toquen el timbre
            </p>

            <PushNotificationPrompt />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}