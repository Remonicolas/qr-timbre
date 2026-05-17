import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/property/property-form'
import { PropertyQRPanel } from '@/components/property/property-qr-panel'

interface Props { params: Promise<{ id: string }> }

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!property) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">{property.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Editá tu propiedad y descargá el QR</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PropertyForm property={property} />
        </div>
        <div>
          <PropertyQRPanel property={property} />
        </div>
      </div>
    </div>
  )
}
