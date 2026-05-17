import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { VisitorClient } from './visitor-client'
import type { VisitorPageData } from '@/types'

interface Props {
  params: Promise<{ qrCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { qrCode } = await params
  const supabase = await createAdminClient()

  const { data: property } = await supabase
    .from('properties')
    .select('name')
    .eq('qr_code', qrCode)
    .eq('is_active', true)
    .single()

  if (!property) {
    return { title: 'Timbre no encontrado | QR Bell' }
  }

  return {
    title: `Tocar timbre - ${property.name} | QR Bell`,
    description: `Tocá el timbre de ${property.name} de forma segura.`,
    robots: { index: false, follow: false },
  }
}

export default async function VisitorPage({ params }: Props) {
  const { qrCode } = await params
  const supabase = await createAdminClient()

  const { data: property } = await supabase
    .from('properties')
    .select(
      'id, name, type, unit_number, photo_url, qr_code, status, is_building_mode, cooldown_seconds, is_active, created_at, updated_at, qr_color, qr_bg_color, address'
    )
    .eq('qr_code', qrCode)
    .eq('is_active', true)
    .single()

  if (!property) {
    notFound()
  }

  const { data: buildingUnits } = property.is_building_mode
    ? await supabase
        .from('building_units')
        .select('*')
        .eq('property_id', property.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    : { data: [] }

  const pageData: VisitorPageData = {
    property,
    building_units: buildingUnits ?? [],
    cooldown_seconds: property.cooldown_seconds,
  }

  return <VisitorClient data={pageData} />
}
