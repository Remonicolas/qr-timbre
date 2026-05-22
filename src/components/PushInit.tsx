'use client'

import { useEffect } from 'react'

export default function PushInit() {
  useEffect(() => {
    if (!('Notification' in window)) return

    if (navigator.serviceWorker) {
      Notification.requestPermission().then((permission) => {
        console.log('Permiso notificaciones:', permission)
      })
    }
  }, [])

  return null
}