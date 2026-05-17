import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['house', 'apartment', 'office', 'store', 'other']).optional(),
  unit_number: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  phone_number: z.string().max(20).optional(),
  status: z.enum(['available', 'busy', 'sleeping', 'do_not_disturb', 'away']).optional(),
  is_building_mode: z.boolean().optional(),
  notification_email: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  notification_sound: z.boolean().optional(),
  cooldown_seconds: z.coerce.number().min(0).max(3600).optional(),
  qr_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  qr_bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  is_active: z.boolean().optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase.from('properties').select('*').eq('id', id).eq('user_id', user.id).single()
  if (error) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data, error: null })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: z.infer<typeof UpdateSchema>
  try {
    body = UpdateSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('properties').update(body).eq('id', id).eq('user_id', user.id).select().single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { error } = await supabase.from('properties').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  return NextResponse.json({ data: { deleted: true }, error: null })
}
