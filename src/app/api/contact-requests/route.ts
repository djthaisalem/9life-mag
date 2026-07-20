import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createContactRequest } from '@/lib/booking-requests'
import { sendBookingTelegramNotice } from '@/lib/booking-telegram'
import { getTrustedClientIp, guardContactRequestAttempts } from '@/lib/request-guard'
import { headers } from 'next/headers'

const contactRequestSchema = z.object({
  topic: z.string().min(1).max(120),
  fullName: z.string().min(2).max(120),
  organization: z.string().max(160).default(''),
  role: z.string().max(120).default(''),
  email: z.string().email().max(160),
  phone: z.string().max(40).default(''),
  referenceLink: z.string().max(500).default(''),
  timeline: z.string().max(160).default(''),
  message: z.string().min(20).max(5000),
  goodwill: z.string().max(2000).default(''),
})

export async function POST(request: Request) {
  try {
    const body = contactRequestSchema.parse(await request.json())
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardContactRequestAttempts(body.email, ip)

    if (!guard.ok) {
      return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
    }

    const created = await createContactRequest(body)
    const telegram = await sendBookingTelegramNotice(created)

    return NextResponse.json({
      ok: true,
      telegramSent: telegram.ok,
      message: 'Đã tiếp nhận liên hệ. Đội ngũ 9LIFE MAG sẽ phản hồi qua thông tin bạn cung cấp.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Thông tin liên hệ chưa hợp lệ.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Chưa thể gửi liên hệ lúc này. Vui lòng thử lại sau.' }, { status: 500 })
  }
}
