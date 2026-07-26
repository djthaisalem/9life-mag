import 'server-only'

import { getTelegramPaymentConfig } from '@/lib/payment-config'

function normalizeTelegramChannel(value: string) {
  const channel = value.trim()
  const publicLink = channel.match(/^https?:\/\/(?:www\.)?t\.me\/([a-z0-9_]+)\/?$/i)
  return publicLink ? `@${publicLink[1]}` : channel
}

async function getTelegramRejection(response: Response) {
  const detail = await response.text().catch(() => '')
  try {
    const parsed = JSON.parse(detail) as { description?: string }
    return parsed.description?.slice(0, 240) || `HTTP ${response.status}`
  } catch {
    return detail.slice(0, 240) || `HTTP ${response.status}`
  }
}

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
        chat_id: normalizeTelegramChannel(channel),
        text: message,
        parse_mode: 'HTML',
      }),
      cache: 'no-store',
    })

    if (response.ok) return { ok: true }

    const detail = await getTelegramRejection(response)
    console.error('Telegram operations delivery failed', {
      status: response.status,
      detail,
    })
    return { ok: false, reason: `Telegram từ chối (${response.status}): ${detail}` }
  } catch (error) {
    console.error('Telegram operations delivery failed', error)
    return { ok: false, reason: 'request-failed' as const }
  }
}

export async function sendTelegramOperationsNotice(message: string) {
  return sendTelegramPaymentNotice(message)
}
