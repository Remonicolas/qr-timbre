import { NextRequest, NextResponse } from 'next/server'
import { firebaseAdmin } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const { token, userId } = await req.json()

  await firebaseAdmin.messaging().subscribeToTopic(
    token,
    `user_${userId}`
  )

  return NextResponse.json({ ok: true })
}