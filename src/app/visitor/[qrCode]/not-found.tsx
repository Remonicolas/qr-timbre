import Link from 'next/link'

export default function VisitorNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background safe-top safe-bottom">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-6xl">🔔</div>
        <div>
          <h1 className="font-display text-xl font-bold mb-2">Timbre no encontrado</h1>
          <p className="text-muted-foreground text-sm">
            Este código QR no es válido o fue desactivado por el propietario.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          ¿Querés crear tu propio timbre digital?{' '}
          <Link href="/" className="text-primary hover:underline">
            QR Bell
          </Link>
        </p>
      </div>
    </div>
  )
}
