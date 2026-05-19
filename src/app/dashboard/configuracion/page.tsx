import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/dashboard/settings-client'

export const metadata = { title: 'Configuración | QR Bell' }

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 🔴 FIX 1: validar user
  if (!user) {
    return (
      <div className="p-6 text-red-500">
        No hay sesión activa
      </div>
    )
  }

  // 🔴 FIX 2: usar maybeSingle (NO rompe si no existe)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestioná tu cuenta y preferencias
        </p>
      </div>

      {/* 🔴 FIX 3: no explotar si profile es null */}
      <SettingsClient profile={profile} />
    </div>
  )
}