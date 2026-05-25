export async function sendWhatsAppMessage(
  to: string,
  message: string
) {
  const res = await fetch(
    `${process.env.WATI_BASE_URL}/api/v1/sendSessionMessage/${to}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WATI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
      }),
    }
  )

  return await res.json()
}