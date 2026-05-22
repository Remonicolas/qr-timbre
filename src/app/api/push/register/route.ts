import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 🔥 obtener user desde JWT del request (NO supabase.auth.getUser)
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No auth header' },
        { status: 401 }
      )
    }

    const tokenJwt = authHeader.replace('Bearer ', '')

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(tokenJwt)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      )
    }

    const { error: dbError } = await supabase
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

    if (dbError) {
      console.error('DB ERROR:', dbError)

      return NextResponse.json(
        { error: 'DB error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('REGISTER ERROR:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}