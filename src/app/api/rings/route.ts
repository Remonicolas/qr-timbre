import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    // 1. GET PROPERTY
    const { data: property } = await supabase
      .from('properties')
      .select('id, user_id, name')
      .eq('qr_code', body.qr_code)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 2. GET USER WHATSAPP
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('whatsapp_number')
      .eq('id', property.user_id)
      .single()

    if (!profile?.whatsapp_number) {
      return NextResponse.json({
        ok: true,
        warning: 'No whatsapp configured'
      })
    }

    // 3. SEND WHATSAPP VIA WATI
    await sendWhatsAppMessage(
      profile.whatsapp_number,
      `🔔 TIMBRE QR\n\n🏠 ${property.name}\n\n👉 Alguien tocó el timbre`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('RINGS ERROR:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}