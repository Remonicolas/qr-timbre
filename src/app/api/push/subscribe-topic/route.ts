import { NextRequest, NextResponse } from 'next/server'
import { firebaseAdmin } from '@/lib/firebase-admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No auth' }, { status: 401 })
    }

    await firebaseAdmin.messaging().subscribeToTopic(
      token,
      `user_${user.id}`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('subscribe-topic error:', err)

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}