'use client'

import { useEffect } from 'react'

export default function PushInit() {
  useEffect(() => {
    console.log('🔥 PushInit mounted')

    if (!('Notification' in window)) return
    if (!navigator.serviceWorker) return

    Notification.requestPermission().then((res) => {
      console.log('🔔 permission:', res)
    })
  }, [])

  return null
}