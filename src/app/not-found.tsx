import Link from 'next/link'
import { ROUTES } from '@/config/app'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background mesh-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-display font-black text-primary/20">404</div>
        <div className="text-5xl">🔍</div>
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">Página no encontrada</h1>
          <p className="text-muted-foreground">
            La página que buscás no existe o fue movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={ROUTES.dashboard}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            Ir al dashboard
          </Link>
          <Link
            href={ROUTES.home}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary transition-all"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
