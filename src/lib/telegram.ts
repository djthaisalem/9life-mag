import 'server-only'

import { getTelegramPaymentConfig } from '@/lib/payment-config'

export async function sendTelegramPaymentNotice(message: string) {
  const { token, channel } = await getTelegramPaymentConfig()

  if (!token || !channel) {
    return { ok: false, reason: 'missing-config' as const }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channel,
        text: message,
      }),
      cache: 'no-store',
    })

    return { ok: response.ok }
  } catch {
    return { ok: false, reason: 'request-failed' as const }
  }
}
