import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPortalNotificationIdentity } from '@/lib/artist-portal-access'
import { getPortalNotifications, markPortalNotificationRead } from '@/lib/portal-notifications'

export async function GET() {
  const identity = await getPortalNotificationIdentity()
  if (!identity) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền xem thông báo.' }, { status: 403 })
  const notifications = await getPortalNotifications(identity.recipientKeys)
  return NextResponse.json({ ok: true, notifications })
}

export async function POST(request: Request) {
  const identity = await getPortalNotificationIdentity()
  if (!identity) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền cập nhật thông báo.' }, { status: 403 })
  const body = z.object({ id: z.string().min(1) }).parse(await request.json())
  const ok = await markPortalNotificationRead(body.id, identity.recipientKeys)
  return NextResponse.json({ ok })
}
