import { NextRequest, NextResponse } from 'next/server'
import { adminMessaging } from '@/lib/firebase-admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No auth' }, { status: 401 })
    }

    // buscar token del usuario
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!subs?.length) {
      return NextResponse.json({ error: 'No tokens' }, { status: 400 })
    }

    const token = subs[0].fcm_token

    const message = {
      token,
      notification: {
        title: '🔔 QR Bell Test',
        body: 'Esta es una notificación de prueba funcionando',
      },
      data: {
        type: 'test',
      },
    }

    const response = await adminMessaging.send(message)

    return NextResponse.json({
      success: true,
      messageId: response,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message ?? 'Error sending push' },
      { status: 500 }
    )
  }
}