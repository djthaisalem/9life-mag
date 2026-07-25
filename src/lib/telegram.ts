import 'server-only'

import { getTelegramPaymentConfig } from '@/lib/payment-config'

export async function sendTelegramPaymentNotice(message: string) {
  try {
    const { token, channel } = await getTelegramPaymentConfig()

    if (!token || !channel) {
      return { ok: false, reason: 'missing-config' as const }
    }

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

    if (response.ok) return { ok: true }

    const detail = await response.text().catch(() => '')
    console.error('Telegram operations delivery failed', {
      status: response.status,
      detail: detail.slice(0, 500),
    })
    return { ok: false, reason: 'telegram-rejected' as const }
  } catch (error) {
    console.error('Telegram operations delivery failed', error)
    return { ok: false, reason: 'request-failed' as const }
  }
}

export async function sendTelegramOperationsNotice(message: string) {
  return sendTelegramPaymentNotice(message)
}
