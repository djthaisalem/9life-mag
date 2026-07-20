import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getBookingRequestsSnapshot, updateBookingStatus } from '@/lib/booking-requests'

const updateSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['Mới', 'Đang báo giá', 'Chờ chốt', 'Đã xác nhận', 'Giữ bàn', 'Đã cọc', 'Hoàn tất', 'Huỷ']),
})

async function getOutletBookings(outletSlugs: string[]) {
  const requests = await getBookingRequestsSnapshot()
  return requests.filter((request) => request.type === 'outlet' && outletSlugs.includes(request.href.split('/').pop() ?? ''))
}

export async function GET() {
  const account = await getArtistPortalApiAccess('booking')
  if (!account) {
    return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền điều phối booking.' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, requests: await getOutletBookings(account.managedOutletSlugs ?? []) })
}

export async function PATCH(request: Request) {
  const account = await getArtistPortalApiAccess('booking')
  if (!account) {
    return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền điều phối booking.' }, { status: 403 })
  }

  try {
    const input = updateSchema.parse(await request.json())
    const requests = await getOutletBookings(account.managedOutletSlugs ?? [])
    if (!requests.some((item) => item.id === input.requestId)) {
      return NextResponse.json({ ok: false, message: 'Yêu cầu đặt bàn không thuộc phạm vi được quản lý.' }, { status: 404 })
    }

    const snapshot = await updateBookingStatus(input)
    return NextResponse.json({ ok: true, requests: snapshot.filter((item) => item.type === 'outlet' && (account.managedOutletSlugs ?? []).includes(item.href.split('/').pop() ?? '')) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Trạng thái booking chưa hợp lệ.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Chưa thể cập nhật booking lúc này.' }, { status: 500 })
  }
}
