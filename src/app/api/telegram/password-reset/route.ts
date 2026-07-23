import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { redeemTelegramRecoveryCode } from '@/lib/password-reset'

type TelegramUpdate = {
  message?: {
    chat?: { id?: number }
    text?: string
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function extractRecoveryCode(text: string) {
  const startMatch = text.match(/^\/start\s+reset_([a-zA-Z0-9-]+)$/i)
  if (startMatch?.[1]) return startMatch[1]

  const resetMatch = text.match(/^(?:reset\s+)?([a-fA-F0-9]{4}(?:-?[a-fA-F0-9]{4}){3})$/i)
  return resetMatch?.[1] ?? ''
}

async function sendTelegramMessage(chatId: number, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN) return false
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: 'no-store',
  })
  return response.ok
}

export async function POST(request: Request) {
  const configuredSecret = env.TELEGRAM_WEBHOOK_SECRET
  const suppliedSecret = request.headers.get('x-telegram-bot-api-secret-token') ?? ''

  if (!configuredSecret || !safeEqual(configuredSecret, suppliedSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = (await request.json()) as TelegramUpdate
  const chatId = update.message?.chat?.id
  const text = update.message?.text?.trim() ?? ''

  if (!chatId) return NextResponse.json({ ok: true })

  const code = extractRecoveryCode(text)
  if (!code) {
    await sendTelegramMessage(
      chatId,
      'Vui lòng gửi mã khôi phục hiển thị trên 9lifemag.com theo mẫu: RESET XXXX-XXXX-XXXX-XXXX'
    )
    return NextResponse.json({ ok: true })
  }

  const result = await redeemTelegramRecoveryCode(code)
  if (!result.ok) {
    await sendTelegramMessage(chatId, 'Mã khôi phục không hợp lệ, đã hết hạn hoặc đã được sử dụng.')
    return NextResponse.json({ ok: true })
  }

  await sendTelegramMessage(
    chatId,
    [
      'Khôi phục mật khẩu 9LIFE MAG',
      `OTP: ${result.otp}`,
      `Link đặt lại mật khẩu: ${result.resetUrl}`,
      'OTP và link có hiệu lực trong 24 giờ, chỉ dùng một lần. Không chia sẻ thông tin này với người khác.',
    ].join('\n\n')
  )

  return NextResponse.json({ ok: true })
}
