import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      )
    }

    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No auth' },
        { status: 401 }
      )
    }

    const jwt = authHeader.replace('Bearer ', '')

    // 🔥 cliente para validar JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      )
    }

    // 🔥 admin client
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await admin
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          fcm_token: token,
          is_active: true,
        },
        {
          onConflict: 'user_id,fcm_token',
          ignoreDuplicates: true,
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
  } catch (e) {
    console.error('REGISTER ERROR:', e)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}