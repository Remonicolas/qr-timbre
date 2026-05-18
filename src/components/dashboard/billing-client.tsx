'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { PLAN_DISPLAY } from '@/lib/stripe/plans'
import { PLAN_FEATURES } from '@/types'
import type { UserProfile, SubscriptionPlan } from '@/types'
import { cn } from '@/utils/cn'

interface Props { profile: UserProfile }

const FEATURES_LABELS = {
  max_properties: (v: number) => `${v} propiedad${v !== 1 ? 'es' : ''}`,
  building_mode: () => 'Modo edificio',
  analytics: () => 'Analíticas avanzadas',
  custom_qr: () => 'QR personalizado',
  quick_responses: () => 'Respuestas rápidas',
  priority_support: () => 'Soporte prioritario',
  camera_intercom: () => 'Cámara e intercomunicador',
  api_access: () => 'Acceso API',
  white_label: () => 'White label',
}

export function BillingClient({ profile }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null)

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === 'free') return
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error al procesar')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setLoading('pro')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  const plans: SubscriptionPlan[] = ['free', 'pro', 'business']

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <p className="font-display text-xl font-bold capitalize mt-1">
              {PLAN_DISPLAY[profile.subscription_plan].name}
            </p>
            {profile.subscription_status && (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{profile.subscription_status}</p>
            )}
          </div>
          {profile.stripe_customer_id && profile.subscription_plan !== 'free' && (
            <button
              onClick={handlePortal}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-all"
            >
              <ExternalLink size={14} />
              Portal de facturación
            </button>
          )}
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn('text-sm', billing === 'monthly' ? 'font-semibold' : 'text-muted-foreground')}>Mensual</span>
        <button
          onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
          className="relative w-12 h-6 bg-border rounded-full transition-all"
        >
          <div className={cn('absolute top-0.5 w-5 h-5 bg-primary rounded-full transition-all', billing === 'yearly' ? 'left-6' : 'left-0.5')} />
        </button>
        <span className={cn('text-sm', billing === 'yearly' ? 'font-semibold' : 'text-muted-foreground')}>
          Anual <span className="text-xs text-green-600 font-semibold">-25%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const display = PLAN_DISPLAY[plan]
          const features = PLAN_FEATURES[plan]
          const isCurrent = profile.subscription_plan === plan
          const isPopular = plan === 'pro'
          const price = billing === 'monthly' ? display.price_monthly : display.price_yearly

          return (
            <motion.div
              key={plan}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'rounded-2xl border-2 bg-card p-5 flex flex-col relative',
                isPopular ? 'border-primary' : isCurrent ? 'border-green-500/50' : 'border-border'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Más popular
                </div>
              )}

              <div className="mb-4">
                <p className="font-display font-bold text-lg">{display.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{display.description}</p>
                <p className="font-display text-3xl font-extrabold mt-3">
                  {price === 0 ? 'Gratis' : `$${price.toLocaleString()}`}
                  {price > 0 && <span className="text-base font-normal text-muted-foreground">/{billing === 'monthly' ? 'mes' : 'año'}</span>}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {Object.entries(features).map(([key, value]) => {
                  if (typeof value === 'boolean' && !value) return null
                  const label = FEATURES_LABELS[key as keyof typeof FEATURES_LABELS]
                  return (
                    <li key={key} className="flex items-center gap-2 text-xs">
                      <Check size={14} className="text-green-500 shrink-0" />
                      <span>{typeof label === 'function' ? (label as (v: never) => string)(value as never) : key}</span>
                    </li>
                  )
                })}
              </ul>

              {isCurrent ? (
                <div className="w-full rounded-xl bg-green-500/10 text-green-600 text-sm font-semibold py-2.5 text-center">
                  ✓ Plan actual
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading !== null || plan === 'free'}
                  className={cn(
                    'w-full rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2',
                    isPopular ? 'bg-primary text-primary-foreground hover:opacity-90' : 'border border-border hover:bg-secondary'
                  )}
                >
                  {loading === plan && <Loader2 size={14} className="animate-spin" />}
                  {plan === 'free' ? 'Plan gratuito' : `Actualizar a ${display.name}`}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        14 días de prueba gratis en planes pagos · Cancelá cuando quieras · Pagos seguros con Stripe
      </p>
    </div>
  )
}
