'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VisitorCategory, VisitorPageData } from '@/types'
import { VISITOR_CATEGORY_LABELS, PROPERTY_STATUS_LABELS } from '@/types'
import { API_ROUTES } from '@/config/app'

interface Props {
  data: VisitorPageData
}

type RingState = 'idle' | 'selecting' | 'writing' | 'ringing' | 'success' | 'cooldown' | 'error'

const STATUS_COLORS = {
  available: '#22c55e',
  busy: '#f59e0b',
  sleeping: '#3b82f6',
  do_not_disturb: '#ef4444',
  away: '#6b7280',
}

const STATUS_EMOJIS = {
  available: '🟢',
  busy: '🟡',
  sleeping: '🔵',
  do_not_disturb: '🔴',
  away: '⚫',
}

export function VisitorClient({ data }: Props) {
  const { property, building_units, cooldown_seconds } = data
  const [ringState, setRingState] = useState<RingState>('idle')
  const [selectedCategory, setSelectedCategory] = useState<VisitorCategory>('guest')
  const [message, setMessage] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const startCooldown = useCallback(() => {
    setCooldownLeft(cooldown_seconds)
    const interval = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setRingState('idle')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [cooldown_seconds])

  const handleRing = async () => {
    setRingState('ringing')

    try {
      const res = await fetch(API_ROUTES.ring, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code: property.qr_code,
          visitor_category: selectedCategory,
          visitor_message: message || undefined,
          unit_id: selectedUnit || undefined,
        }),
      })

      if (res.status === 429) {
        setRingState('cooldown')
        startCooldown()
        return
      }

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setErrorMessage(err.error ?? 'Error al tocar el timbre')
        setRingState('error')
        return
      }

      // Vibrate on success
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }

      setRingState('success')
      setTimeout(() => {
        setRingState('cooldown')
        startCooldown()
      }, 3000)
    } catch {
      setErrorMessage('Sin conexión. Verificá tu internet.')
      setRingState('error')
    }
  }

  const statusColor = STATUS_COLORS[property.status] ?? '#6b7280'
  const statusEmoji = STATUS_EMOJIS[property.status] ?? '⚫'
  const statusLabel = PROPERTY_STATUS_LABELS[property.status]

  return (
    <div className="min-h-screen visitor-gradient flex flex-col items-center justify-center p-4 safe-top safe-bottom">
      {/* Property Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {property.photo_url ? (
            <img
              src={property.photo_url}
              alt={property.name}
              className="w-24 h-24 rounded-3xl object-cover mx-auto mb-4 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-4xl">
              🏠
            </div>
          )}
          <h1 className="font-display text-2xl font-bold mb-1">{property.name}</h1>
          {property.unit_number && (
            <p className="text-muted-foreground text-sm">Unidad {property.unit_number}</p>
          )}
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            <span>{statusEmoji}</span>
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Building Mode: Unit Selector */}
        {property.is_building_mode && building_units.length > 0 && ringState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <p className="text-sm font-medium text-center mb-3 text-muted-foreground">
              ¿A quién buscás?
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {building_units.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnit(unit.id)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedUnit === unit.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="font-semibold text-sm">{unit.unit_number}</div>
                  {unit.resident_name && (
                    <div className="text-xs text-muted-foreground truncate">{unit.resident_name}</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Visitor Category */}
        <AnimatePresence mode="wait">
          {(ringState === 'idle' || ringState === 'selecting') && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <p className="text-sm font-medium text-center mb-3 text-muted-foreground">
                ¿Quién sos?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(VISITOR_CATEGORY_LABELS) as [VisitorCategory, string][]).map(
                  ([cat, label]) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Message */}
        {ringState !== 'ringing' && ringState !== 'success' && ringState !== 'cooldown' && (
          <div className="mb-6">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje opcional..."
              maxLength={150}
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {message.length > 0 && (
              <p className="text-xs text-muted-foreground text-right mt-1">
                {message.length}/150
              </p>
            )}
          </div>
        )}

        {/* Ring Button */}
        <AnimatePresence mode="wait">
          {ringState === 'idle' || ringState === 'selecting' ? (
            <motion.button
              key="ring-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRing}
              disabled={property.status === 'do_not_disturb'}
              className="relative w-full py-5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed ring-button"
            >
              🔔 Tocar Timbre
            </motion.button>
          ) : ringState === 'ringing' ? (
            <motion.div
              key="ringing"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full py-5 rounded-2xl bg-primary/20 text-primary font-display font-bold text-xl text-center"
            >
              <motion.span
                animate={{ rotate: [-10, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block"
              >
                🔔
              </motion.span>{' '}
              Enviando...
            </motion.div>
          ) : ringState === 'success' ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full py-5 rounded-2xl bg-green-500/10 text-green-600 font-display font-bold text-xl text-center"
            >
              ✅ ¡Timbre enviado!
            </motion.div>
          ) : ringState === 'cooldown' ? (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5"
            >
              <p className="text-muted-foreground text-sm mb-1">Esperá para volver a llamar</p>
              <p className="font-display text-3xl font-bold text-primary">{cooldownLeft}s</p>
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="w-full py-4 rounded-2xl bg-destructive/10 text-destructive text-center text-sm font-medium">
                ❌ {errorMessage}
              </div>
              <button
                onClick={() => setRingState('idle')}
                className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-all"
              >
                Intentar de nuevo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {property.status === 'do_not_disturb' && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            🔴 El residente activó &ldquo;No Molestar&rdquo;
          </p>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Tu número nunca será compartido •{' '}
            <span className="text-primary font-medium">QR Bell</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
