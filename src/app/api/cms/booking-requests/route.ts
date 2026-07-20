import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import {
  getBookingRequestsSnapshot,
  updateBookingReminderConfig,
  updateBookingStatus,
} from '@/lib/booking-requests'

const bookingRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update-status'),
    requestId: z.string().min(1),
    status: z.enum(['Mới', 'Đang báo giá', 'Chờ chốt', 'Đã xác nhận', 'Giữ bàn', 'Đã cọc', 'Hoàn tất', 'Huỷ']),
  }),
  z.object({
    action: z.literal('update-reminder-config'),
    requestId: z.string().min(1),
    reminderConfig: z.object({
      telegramChannel: z.string().default(''),
      profileChannel: z.string().default(''),
      reminderAt: z.string().default(''),
      soundcheckAt: z.string().default(''),
      checkinAt: z.string().default(''),
      followUpAt: z.string().default(''),
      assistantNote: z.string().default(''),
    }),
  }),
])

export async function GET() {
  try {
    const access = await requireCmsApiAccess('booking')
    if (!access.ok) {
      return access.response
    }

    const snapshot = await getBookingRequestsSnapshot()
    return NextResponse.json({ ok: true, snapshot })
  } catch {
    return NextResponse.json({ ok: false, message: 'Không thể tải dữ liệu booking.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireCmsApiAccess('booking')
    if (!access.ok) {
      return access.response
    }

    const body = await request.json()
    const payload = bookingRequestSchema.parse(body)

    const snapshot =
      payload.action === 'update-status'
        ? await updateBookingStatus(payload)
        : await updateBookingReminderConfig(payload)

    return NextResponse.json({
      ok: true,
      snapshot,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu booking chưa hợp lệ.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể cập nhật booking lúc này.',
      },
      { status: 500 },
    )
  }
}
