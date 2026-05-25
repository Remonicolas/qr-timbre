import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      endpoint,
      keys,
      user_agent,
    } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 🔥 usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // =========================================================
    // UPSERT SUBSCRIPTION
    // =========================================================

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,

        endpoint,

        p256dh: keys.p256dh,
        auth: keys.auth,

        user_agent:
          user_agent ?? null,

        is_active: true,
      })

    if (error) {
      console.error(error)

      return NextResponse.json(
        { error: 'DB error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}