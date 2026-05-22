import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = body.token

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // 👇 usar JWT solo para identificar user
    const jwt = authHeader.replace('Bearer ', '')

    const {
      data: { user },
    } = await supabase.auth.getUser(jwt)

    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          fcm_token: token,
          is_active: true,
        },
        {
          onConflict: 'user_id,fcm_token',
        }
      )

    if (error) {
      console.error('DB ERROR:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('REGISTER ERROR:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}