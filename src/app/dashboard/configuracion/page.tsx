import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/dashboard/settings-client'

export const metadata = { title: 'Configuración | QR Bell' }

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🔴 FIX 1: validar sesión
  if (!user) {
    return (
      <div className="p-6 text-red-500">
        No hay sesión activa
      </div>
    )
  }

  // 🔴 FIX 2: traer profile
  let { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // 🔴 FIX 3: auto crear profile si no existe
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: '',
        role: 'user',
        subscription_plan: 'free',
        max_properties: 1,
      })
      .select()
      .single()

    if (error) {
      console.error('🔥 PROFILE ERROR:', JSON.stringify(error, null, 2))

      return (
        <div className="p-6 text-red-500">
          Error creando perfil de usuario
        </div>
      )
    }

    profile = newProfile
  }

  // 🔴 FIX 4: seguridad extra
  if (!profile) {
    return (
      <div className="p-6 text-red-500">
        No se pudo cargar el perfil
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Configuración
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestioná tu cuenta y preferencias
        </p>
      </div>

      <SettingsClient profile={profile} />
    </div>
  )
}