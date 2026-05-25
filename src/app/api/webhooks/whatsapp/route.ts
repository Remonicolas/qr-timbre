import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// VERIFY WEBHOOK
// =====================================================

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, {
      status: 200,
    })
  }

  return new NextResponse('Forbidden', {
    status: 403,
  })
}

// =====================================================
// RECEIVE EVENTS
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    console.log(
      '📲 WHATSAPP WEBHOOK:',
      JSON.stringify(body, null, 2)
    )

    return NextResponse.json({
      received: true,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: true },
      { status: 500 }
    )
  }
}