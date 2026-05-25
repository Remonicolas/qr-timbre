export async function sendWhatsAppMessage(
  to: string,
  message: string
) {
  try {
    const response = await fetch(
      `${process.env.WATI_API_URL}/api/v1/sendSessionMessage`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WATI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: to,
          message,
        }),
      }
    )

    const data = await response.json()

    console.log('📲 WATI RESPONSE:', data)

    return data
  } catch (err) {
    console.error('❌ WATI ERROR:', err)
  }
}