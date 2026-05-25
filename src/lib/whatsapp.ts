export async function sendWhatsAppMessage(
  to: string,
  message: string
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    )

    const data = await response.json()

    console.log('📲 WHATSAPP RESPONSE:', data)

    return data
  } catch (err) {
    console.error('❌ WHATSAPP ERROR:', err)
  }
}