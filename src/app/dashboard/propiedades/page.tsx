import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ROUTES } from '@/config/app'
import { PropertiesList } from '@/components/property/properties-list'
import { Plus } from 'lucide-react'

export const metadata = { title: 'Propiedades | QR Bell' }

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: properties }, { data: profile }] = await Promise.all([
    supabase.from('properties').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('max_properties, subscription_plan').eq('id', user!.id).single(),
  ])

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mis Propiedades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties?.length ?? 0} de {profile?.max_properties ?? 1} propiedades
          </p>
        </div>
        {(properties?.length ?? 0) < (profile?.max_properties ?? 1) ? (
          <Link
            href={ROUTES.newProperty}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            Nueva propiedad
          </Link>
        ) : (
          <Link
            href={ROUTES.billing}
            className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            ⬆️ Actualizar plan
          </Link>
        )}
      </div>
      <PropertiesList properties={properties ?? []} />
    </div>
  )
}
