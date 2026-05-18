import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/app'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.login)
  }

  let { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si no existe el perfil, crearlo
  if (!profile) {
    const { data: created } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: 'user',
        subscription_plan: 'free',
        max_properties: 1,
      })
      .select()
      .single()

    profile = created
  }

  // Si sigue sin existir, usar datos del auth directamente sin redirigir
  const safeProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? 'Usuario',
    avatar_url: user.user_metadata?.avatar_url ?? null,
    phone: null,
    role: 'user' as const,
    subscription_plan: 'free' as const,
    subscription_status: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    max_properties: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar profile={safeProfile} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader profile={safeProfile} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
