import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { saveTelegramBookingChannel } from '@/lib/payment-config'

const schema = z.object({ channel: z.string().trim().min(1).max(180) })

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'stars',
  )
  const access = capability ? { ok: true as const } : await requireCmsApiAccess('booking')
  if (!access.ok) return access.response

  try {
    const input = schema.parse(await request.json())
    const result = await saveTelegramBookingChannel(input.channel)
    return NextResponse.json({ ok: true, channel: result.channel, message: 'Đã lưu nhóm Telegram tổng cho Booking.' })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error && error.message === 'telegram_channel_required') {
      return NextResponse.json({ ok: false, message: 'Nhập nhóm Telegram hợp lệ trước khi lưu.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Chưa thể lưu cấu hình Telegram lúc này.' }, { status: 500 })
  }
}
