import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { ROUTES } from '@/config/app'
import { PLAN_FEATURES } from '@/types'

export const metadata: Metadata = {
  title: 'Precios | QR Bell - Timbre Digital',
  description: 'Planes desde gratis. QR Bell Pro para múltiples propiedades. Business para edificios.',
  alternates: { canonical: '/precios' },
}

const PLANS = [
  {
    key: 'free' as const,
    name: 'Gratis',
    price: 0,
    description: 'Para empezar',
    color: 'border-border',
    highlight: false,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: 9.99,
    description: 'Para propiedades múltiples',
    color: 'border-primary',
    highlight: true,
  },
  {
    key: 'business' as const,
    name: 'Business',
    price: 29.99,
    description: 'Para edificios y empresas',
    color: 'border-purple-500',
    highlight: false,
  },
]

const FEATURE_LABELS = [
  { key: 'max_properties', label: 'Propiedades', render: (v: number) => `${v} propiedad${v !== 1 ? 'es' : ''}` },
  { key: 'quick_responses', label: 'Respuestas rápidas', render: (v: boolean) => v },
  { key: 'custom_qr', label: 'QR personalizado', render: (v: boolean) => v },
  { key: 'analytics', label: 'Analíticas avanzadas', render: (v: boolean) => v },
  { key: 'building_mode', label: 'Modo edificio', render: (v: boolean) => v },
  { key: 'priority_support', label: 'Soporte prioritario', render: (v: boolean) => v },
  { key: 'camera_intercom', label: 'Cámara e intercomunicador', render: (v: boolean) => v },
  { key: 'api_access', label: 'Acceso API', render: (v: boolean) => v },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <span className="font-display text-xl font-bold gradient-text">QR Bell</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={ROUTES.login} className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
          <Link href={ROUTES.register} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Empezar gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl font-extrabold mb-4">Planes simples y transparentes</h1>
          <p className="text-muted-foreground text-lg">Empezá gratis. Escalá cuando lo necesites.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const features = PLAN_FEATURES[plan.key]
            return (
              <div
                key={plan.key}
                className={`rounded-2xl border-2 bg-card p-6 flex flex-col relative ${plan.color}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    Más popular
                  </div>
                )}

                <div className="mb-6">
                  <p className="font-display text-xl font-bold">{plan.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-extrabold">
                      {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/mes</span>}
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {FEATURE_LABELS.map(({ key, label, render }) => {
                    const value = features[key as keyof typeof features]
                    const rendered = render(value as never)
                    const isUnavailable = rendered === false

                    return (
                      <li
                        key={key}
                        className={`flex items-center gap-2 text-sm ${isUnavailable ? 'text-muted-foreground/40 line-through' : ''}`}
                      >
                        <Check
                          size={15}
                          className={isUnavailable ? 'text-muted-foreground/30' : 'text-green-500'}
                        />
                        <span>{typeof rendered === 'number' ? `${rendered} propiedad${rendered !== 1 ? 'es' : ''}` : label}</span>
                      </li>
                    )
                  })}
                </ul>

                <Link
                  href={ROUTES.register}
                  className={`w-full rounded-xl py-3 text-sm font-bold text-center transition-all ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'border border-border hover:bg-secondary'
                  }`}
                >
                  {plan.price === 0 ? 'Empezar gratis' : `Probar ${plan.name} gratis`}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          14 días de prueba gratis en planes pagos · Sin tarjeta requerida · Cancelá cuando quieras
        </p>
      </div>
    </div>
  )
}
