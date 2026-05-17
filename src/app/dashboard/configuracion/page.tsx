import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/dashboard/settings-client'

export const metadata = { title: 'Configuración | QR Bell' }

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestioná tu cuenta y preferencias</p>
      </div>
      <SettingsClient profile={profile!} />
    </div>
  )
}
