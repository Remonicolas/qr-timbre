import { createClient } from '@/lib/supabase/server'
import { BillingClient } from '@/components/dashboard/billing-client'

export const metadata = { title: 'Suscripción | QR Bell' }

export default async function SuscripcionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestioná tu plan de QR Bell</p>
      </div>
      <BillingClient profile={profile!} />
    </div>
  )
}
