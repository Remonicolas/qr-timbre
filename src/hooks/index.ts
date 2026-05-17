// ============================================================
// QR BELL - Custom React Hooks
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { API_ROUTES } from '@/config/app'
import type { Property, RingEvent, Notification, UserProfile } from '@/types'

// ─── useProperties ────────────────────────────────────────────

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_ROUTES.properties)
      if (!res.ok) throw new Error('Error al cargar propiedades')
      const data = await res.json() as { data: Property[] }
      setProperties(data.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const deleteProperty = useCallback(async (id: string) => {
    const res = await fetch(API_ROUTES.property(id), { method: 'DELETE' })
    if (res.ok) setProperties((prev) => prev.filter((p) => p.id !== id))
    return res.ok
  }, [])

  const updateStatus = useCallback(async (id: string, status: Property['status']) => {
    const res = await fetch(API_ROUTES.property(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      )
    }
    return res.ok
  }, [])

  return { properties, loading, error, refetch: fetchProperties, deleteProperty, updateStatus }
}

// ─── useRealtimeRings ─────────────────────────────────────────

interface UseRealtimeRingsOptions {
  propertyIds: string[]
  userId: string
  onNewRing?: (ring: RingEvent) => void
}

export function useRealtimeRings({ propertyIds, userId, onNewRing }: UseRealtimeRingsOptions) {
  const supabase = createClient()
  const onNewRingRef = useRef(onNewRing)
  onNewRingRef.current = onNewRing

  useEffect(() => {
    if (!propertyIds.length) return

    const channel = supabase
      .channel(`rings:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ring_events',
          filter: `property_id=in.(${propertyIds.join(',')})`,
        },
        (payload) => {
          onNewRingRef.current?.(payload.new as RingEvent)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [propertyIds.join(','), userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ─── usePropertyStatus ────────────────────────────────────────

export function usePropertyStatus(propertyId: string) {
  const supabase = createClient()
  const [status, setStatus] = useState<Property['status'] | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`property:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'properties',
          filter: `id=eq.${propertyId}`,
        },
        (payload) => {
          const updated = payload.new as Property
          setStatus(updated.status)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [propertyId]) // eslint-disable-line react-hooks/exhaustive-deps

  return status
}

// ─── useNotifications ─────────────────────────────────────────

export function useNotifications(userId: string) {
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Initial count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setUnreadCount(0)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { unreadCount, notifications, markAllRead }
}

// ─── usePushSubscription ──────────────────────────────────────

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsSupported(supported)
    if (supported) {
      setPermission(Notification.permission)
      setIsSubscribed(Notification.permission === 'granted')
    }
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      const res = await fetch(API_ROUTES.subscribe, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
          auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
          browser: getBrowserName(),
        }),
      })

      if (res.ok) {
        setIsSubscribed(true)
        return true
      }
      return false
    } catch (err) {
      console.error('Push subscription error:', err)
      return false
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(API_ROUTES.unsubscribe, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
      return true
    } catch {
      return false
    }
  }, [])

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe }
}

// ─── usePWAInstall ────────────────────────────────────────────

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
    return outcome === 'accepted'
  }, [installPrompt])

  return { canInstall: !!installPrompt && !isInstalled, isInstalled, promptInstall }
}

// ─── useDebounce ──────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─── Utilities ────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown'
}

// Type augmentation for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
