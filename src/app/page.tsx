import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/app'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'QR Bell - El timbre inteligente sin revelar tu número',
  description: 'Recibí visitas con un código QR. Delivery, invitados, correo — todo sin dar tu número de teléfono.',
  alternates: { canonical: '/' },
}

// start_url is "/" — this page handles both:
// 1. Unauthenticated: show landing page
// 2. Authenticated (PWA launch): redirect to dashboard
// This is critical for iOS PWA — start_url must be reachable without auth
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in and opened from PWA/home screen → go to dashboard
  if (user) {
    redirect(ROUTES.dashboard)
  }

  // Not logged in → show public landing page
  return <LandingPage />
}
