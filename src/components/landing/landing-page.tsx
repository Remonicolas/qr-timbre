import Link from 'next/link'
import { ROUTES } from '@/config/app'

const features = [
  { icon: '🔔', title: 'Timbre Digital', description: 'Tus visitantes escanean el QR y te avisan. Sin revelar tu teléfono ni tu número.' },
  { icon: '📦', title: 'Categorías de Visita', description: 'Delivery, invitados, correo, emergencia. Sabés quién llama antes de bajar.' },
  { icon: '📲', title: 'Notificaciones Instantáneas', description: 'Recibí alertas en tiempo real aunque tengas la app cerrada.' },
  { icon: '🏢', title: 'Modo Edificio', description: 'Un QR, múltiples departamentos. Perfecto para edificios y condominios.' },
  { icon: '💬', title: 'Respuestas Rápidas', description: '"Ya bajo", "Dejá el paquete" y más. Respondé en un toque.' },
  { icon: '🔒', title: '100% Privado', description: 'Tu número nunca se comparte. Seguridad total para vos y tu familia.' },
]

const statuses = [
  { emoji: '🟢', label: 'Disponible' },
  { emoji: '🟡', label: 'Ocupado' },
  { emoji: '🔵', label: 'Durmiendo' },
  { emoji: '🔴', label: 'No Molestar' },
  { emoji: '⚫', label: 'Ausente' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full glass border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              <span className="font-display text-xl font-bold gradient-text">QR Bell</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#funciones" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funciones</Link>
              <Link href={ROUTES.pricing} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precios</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href={ROUTES.login} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
              <Link href={ROUTES.register} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Empezar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="mesh-bg absolute inset-0 pointer-events-none" />
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Tu privacidad, primero
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            El timbre que{' '}
            <span className="gradient-text">protege</span>
            <br />tu número
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Poné un QR en tu puerta. Tus visitantes lo escanean y te avisan.
            Sin apps, sin cuentas, sin revelar tu teléfono.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ROUTES.register}
              className="w-full sm:w-auto rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25 glow"
            >
              🔔 Crear mi timbre gratis
            </Link>
            <Link
              href="/timbre/demo"
              className="w-full sm:w-auto rounded-2xl border border-border px-8 py-4 text-base font-semibold hover:bg-secondary transition-all"
            >
              👆 Ver demo de visitante
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Gratis para siempre · Sin tarjeta de crédito · Listo en 2 minutos
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-extrabold mb-4">Todo lo que necesitás</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diseñado para ser simple para tus visitantes y poderoso para vos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg transition-all group">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Modes */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-display text-4xl font-extrabold mb-4">Tu estado, tu control</h2>
          <p className="text-muted-foreground text-lg mb-12">Tus visitantes ven tu estado antes de tocar el timbre.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {statuses.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card px-6 py-3 font-medium text-sm">
                {s.emoji} {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-extrabold mb-4">Empezá en 2 minutos</h2>
          <p className="text-muted-foreground text-lg mb-10">
            Creá tu cuenta, configurá tu propiedad y descargá tu QR.
          </p>
          <Link
            href={ROUTES.register}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-lg font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-105 glow shadow-lg shadow-primary/25"
          >
            🔔 Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <span className="font-display font-bold gradient-text">QR Bell</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href={ROUTES.privacy} className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href={ROUTES.terms} className="hover:text-foreground transition-colors">Términos</Link>
              <Link href={ROUTES.contact} className="hover:text-foreground transition-colors">Contacto</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} QR Bell. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
