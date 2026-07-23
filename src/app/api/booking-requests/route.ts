import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendBookingTelegramNotice } from '@/lib/booking-telegram'
import { createPublicBookingRequest } from '@/lib/booking-requests'
import { getTrustedClientIp, guardContactRequestAttempts } from '@/lib/request-guard'

const commonFields = {
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().min(8).max(40),
  notes: z.string().trim().max(3000).default(''),
}

const requestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('artist'),
    ...commonFields,
    eventName: z.string().trim().min(2).max(160),
    artist: z.string().trim().min(1).max(160),
    artistSlug: z.string().trim().max(160).default(''),
    showDate: z.string().trim().min(1).max(40),
    eventLocation: z.string().trim().min(2).max(200),
    performanceType: z.string().trim().max(120),
    soundcheck: z.string().trim().max(200).default(''),
    budget: z.string().trim().max(120).default(''),
  }),
  z.object({
    type: z.literal('outlet'),
    ...commonFields,
    outlet: z.string().trim().min(1).max(160),
    outletSlug: z.string().trim().max(160).default(''),
    bookingDate: z.string().trim().min(1).max(40),
    arrivalTime: z.string().trim().max(80),
    guestCount: z.string().trim().min(1).max(80),
    tableType: z.string().trim().max(120),
    budget: z.string().trim().max(120).default(''),
    occasion: z.string().trim().max(120).default(''),
  }),
])

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json())
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardContactRequestAttempts(
      `${payload.type}:${payload.contactPhone}`,
      ip
    )

    if (!guard.ok) {
      return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
    }

    const created =
      payload.type === 'artist'
        ? await createPublicBookingRequest({
            type: 'artist',
            title: payload.artist,
            requester: payload.contactName,
            location: payload.eventLocation,
            schedule: payload.showDate,
            detail: `${payload.eventName}${payload.budget ? ` · ${payload.budget}` : ''}`,
            href: payload.artistSlug
              ? `/cms/dashboard/artists/${payload.artistSlug}`
              : '/cms/dashboard/booking/artists',
            submittedFields: [
              { label: 'Sự kiện', value: payload.eventName },
              { label: 'Nghệ sĩ', value: payload.artist },
              { label: 'Ngày biểu diễn', value: payload.showDate },
              { label: 'Địa điểm', value: payload.eventLocation },
              { label: 'Loại show', value: payload.performanceType },
              { label: 'Soundcheck', value: payload.soundcheck || 'Chưa xác định' },
              { label: 'Ngân sách', value: payload.budget || 'Chưa cung cấp' },
              { label: 'Người liên hệ', value: payload.contactName },
              { label: 'Số điện thoại / Zalo', value: payload.contactPhone },
              { label: 'Mô tả thêm', value: payload.notes || 'Không có' },
            ],
          })
        : await createPublicBookingRequest({
            type: 'outlet',
            title: payload.outlet,
            requester: payload.contactName,
            location: payload.outlet,
            schedule: payload.bookingDate,
            detail: `${payload.guestCount} · ${payload.tableType}${payload.budget ? ` · ${payload.budget}` : ''}`,
            href: payload.outletSlug
              ? `/cms/dashboard/outlets/${payload.outletSlug}`
              : '/cms/dashboard/booking/outlets',
            submittedFields: [
              { label: 'Outlet', value: payload.outlet },
              { label: 'Ngày đặt bàn', value: payload.bookingDate },
              { label: 'Giờ đến', value: payload.arrivalTime },
              { label: 'Số khách', value: payload.guestCount },
              { label: 'Loại bàn', value: payload.tableType },
              { label: 'Ngân sách', value: payload.budget || 'Chưa cung cấp' },
              { label: 'Dịp đặt bàn', value: payload.occasion || 'Chưa cung cấp' },
              { label: 'Người đặt', value: payload.contactName },
              { label: 'Số điện thoại', value: payload.contactPhone },
              { label: 'Ghi chú', value: payload.notes || 'Không có' },
            ],
          })

    const telegram = await sendBookingTelegramNotice(created)
    return NextResponse.json({
      ok: true,
      telegramSent: telegram.ok,
      message:
        payload.type === 'artist'
          ? 'Đã gửi yêu cầu booking nghệ sĩ. Đội vận hành sẽ liên hệ lại theo thông tin bạn cung cấp.'
          : 'Đã gửi yêu cầu đặt bàn. Outlet sẽ kiểm tra và liên hệ xác nhận.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: error.issues[0]?.message ?? 'Thông tin booking chưa hợp lệ.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { ok: false, message: 'Chưa thể gửi yêu cầu lúc này. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
