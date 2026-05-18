'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Plus, Bell, Home, TrendingUp, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/config/app'
import { VISITOR_CATEGORY_LABELS, PROPERTY_STATUS_LABELS } from '@/types'
import type { UserProfile, Property, RingEvent } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  profile: UserProfile
  properties: Property[]
  recentRings: (RingEvent & { property: { name: string; type: string } | null })[]
}

function RingToast({ ring, propertyName }: { ring: RingEvent; propertyName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 w-80 rounded-2xl border border-border bg-card shadow-xl shadow-black/20 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl animate-bounce">🔔</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">¡Tocaron el timbre!</p>
          <p className="text-xs text-muted-foreground mt-0.5">{propertyName}</p>
          <p className="text-xs font-medium text-primary mt-1">
            {VISITOR_CATEGORY_LABELS[ring.visitor_category]}
          </p>
          {ring.visitor_message && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              &ldquo;{ring.visitor_message}&rdquo;
            </p>
          )}
        </div>
      </div>
      <Link
        href={ROUTES.history}
        className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
      >
        Ver historial →
      </Link>
    </motion.div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  available: 'text-green-500',
  busy: 'text-yellow-500',
  sleeping: 'text-blue-500',
  do_not_disturb: 'text-red-500',
  away: 'text-muted-foreground',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  pro: 'Pro',
  business: 'Business',
}

export function DashboardOverview({ profile, properties, recentRings: initialRings }: Props) {
  const [rings, setRings] = useState(initialRings)
  const [liveToast, setLiveToast] = useState<{
    ring: RingEvent
    propertyName: string
  } | null>(null)

  // FIX: usar ref para supabase y no incluirlo en dependencias
  const supabaseRef = useRef(createClient())

  // FIX: memorizar los IDs como string para evitar re-renders por referencia de array
  const propertyIdsString = properties.map((p) => p.id).join(',')

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {
      // AudioContext no disponible, ignorar
    }
  }, [])

  useEffect(() => {
    // FIX: solo suscribir si hay propiedades
    if (!propertyIdsString) return

    const propertyIds = propertyIdsString.split(',')
    const propertyMap = Object.fromEntries(
      properties.map((p) => [p.id, p.name])
    )

    const supabase = supabaseRef.current
    const channel = supabase
      .channel('dashboard-rings-' + propertyIdsString.slice(0, 20))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ring_events',
          filter: `property_id=in.(${propertyIds.join(',')})`,
        },
        (payload) => {
          const newRing = payload.new as RingEvent
          const propName = propertyMap[newRing.property_id] ?? 'Propiedad'

          setRings((prev) => [
            { ...newRing, property: { name: propName, type: 'apartment' } },
            ...prev.slice(0, 9),
          ])

          setLiveToast({ ring: newRing, propertyName: propName })
          setTimeout(() => setLiveToast(null), 5000)
          playNotificationSound()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // FIX: usar el string de IDs como dependencia, no el array de objetos
  }, [propertyIdsString, playNotificationSound]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalRingsToday = rings.filter((r) => {
    const today = new Date()
    const ringDate = new Date(r.created_at)
    return ringDate.toDateString() === today.toDateString()
  }).length

  return (
    <>
      <AnimatePresence>
        {liveToast && (
          <RingToast ring={liveToast.ring} propertyName={liveToast.propertyName} />
        )}
      </AnimatePresence>

      <div className="space-y-6 pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">
              Hola, {profile.full_name?.split(' ')[0] ?? 'Usuario'} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Link
            href={ROUTES.newProperty}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva propiedad</span>
            <span className="sm:hidden">+</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Propiedades',
              value: properties.length,
              icon: Home,
              color: 'text-blue-500',
            },
            {
              label: 'Timbrazos hoy',
              value: totalRingsToday,
              icon: Bell,
              color: 'text-primary',
            },
            {
              label: 'Total historial',
              value: rings.length,
              icon: TrendingUp,
              color: 'text-green-500',
            },
            {
              label: 'Plan actual',
              value: PLAN_LABELS[profile.subscription_plan] ?? 'Gratis',
              icon: CreditCard,
              color: 'text-purple-500',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className={`${stat.color} mb-2`}>
                <stat.icon size={20} />
              </div>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Properties */}
        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="font-display text-lg font-bold mb-2">Tu primer timbre</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Creá tu primera propiedad y generá un código QR para tu puerta.
            </p>
            <Link
              href={ROUTES.newProperty}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
            >
              <Plus size={16} />
              Crear propiedad
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Mis propiedades</h2>
              <Link href={ROUTES.properties} className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 6).map((property) => (
                <Link
                  key={property.id}
                  href={ROUTES.property(property.id)}
                  className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                      {property.type === 'house'
                        ? '🏠'
                        : property.type === 'office'
                        ? '🏢'
                        : property.type === 'store'
                        ? '🏪'
                        : '🏘️'}
                    </div>
                    <span className={`text-xs font-medium ${STATUS_COLORS[property.status] ?? 'text-muted-foreground'}`}>
                      ● {PROPERTY_STATUS_LABELS[property.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {property.name}
                  </h3>
                  {property.unit_number && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unidad {property.unit_number}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Rings */}
        {rings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Actividad reciente</h2>
              <Link href={ROUTES.history} className="text-sm text-primary hover:underline">
                Ver historial
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {rings.slice(0, 5).map((ring) => (
                <div key={ring.id} className="flex items-center gap-4 p-4">
                  <div className="text-xl">🔔</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {ring.property?.name ?? 'Propiedad'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {VISITOR_CATEGORY_LABELS[ring.visitor_category]}
                      {ring.visitor_message && ` · "${ring.visitor_message}"`}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(ring.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
