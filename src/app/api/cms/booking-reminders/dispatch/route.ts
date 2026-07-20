import { NextResponse } from 'next/server'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { dispatchDueBookingReminders } from '@/lib/booking-telegram'

export async function POST() {
  try {
    const access = await requireCmsApiAccess('booking')
    if (!access.ok) {
      return access.response
    }

    const result = await dispatchDueBookingReminders()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể chạy tác vụ nhắc việc booking lúc này.',
      },
      { status: 500 },
    )
  }
}
