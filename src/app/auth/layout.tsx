import Link from 'next/link'
import { ROUTES } from '@/config/app'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 mesh-bg">
      <Link href={ROUTES.home} className="flex items-center gap-2 mb-8">
        <span className="text-3xl">🔔</span>
        <span className="font-display text-2xl font-bold gradient-text">QR Bell</span>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} QR Bell · Todos los derechos reservados
      </p>
    </div>
  )
}
