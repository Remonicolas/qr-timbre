import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const RespondSchema = z.object({
  response: z.string().min(1).max(200),
})

interface Params { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: z.infer<typeof RespondSchema>
  try {
    body = RespondSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verify ownership via property
  const { data: ring } = await supabase
    .from('ring_events')
    .select('id, property:properties(user_id)')
    .eq('id', id)
    .single()

  const propertyData = ring?.property as { user_id?: string } | null
  if (!ring || propertyData?.user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { error } = await supabase
    .from('ring_events')
    .update({ quick_response: body.response, status: 'responded', responded_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json({ data: { responded: true }, error: null })
}
