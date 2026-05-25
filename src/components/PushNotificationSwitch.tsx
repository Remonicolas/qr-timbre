'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useFirebasePush } from '@/hooks/use-firebase-push'
import { cn } from '@/utils/cn'

export function PushNotificationSwitch() {
  const { state, subscribe, unsubscribe } = useFirebasePush()
  const [loading, setLoading] = useState(false)

  const isActive = state === 'subscribed'
  const isDenied = state === 'denied'

  const toggle = async () => {
    try {
      setLoading(true)

      if (isActive) {
        await unsubscribe()
        return
      }

      await subscribe()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-xl">
      <div className="flex items-center gap-2">
        {isActive ? <Bell size={18} /> : <BellOff size={18} />}
        <span className="text-sm font-medium">
          Notificaciones push
        </span>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={loading || isDenied}
        className={cn(
          'w-12 h-6 rounded-full transition-all relative',
          isActive ? 'bg-green-500' : 'bg-gray-300',
          isDenied && 'opacity-40 cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="absolute left-1 top-1 animate-spin" size={14} />
        ) : (
          <div
            className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all',
              isActive ? 'right-0.5' : 'left-0.5'
            )}
          />
        )}
      </button>

      {isDenied && (
        <p className="text-xs text-red-500 ml-3">
          Bloqueado en navegador
        </p>
      )}
    </div>
  )
}