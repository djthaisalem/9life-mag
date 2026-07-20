import { NextResponse } from 'next/server'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { getPortalNotifications, markPortalNotificationRead } from '@/lib/portal-notifications'

export async function GET() {
  const access = await requireCmsApiAccess('api_security')
  if (!access.ok) return access.response
  return NextResponse.json({ ok: true, notifications: await getPortalNotifications(['admin']) })
}

export async function POST(request: Request) {
  const access = await requireCmsApiAccess('api_security')
  if (!access.ok) return access.response
  const body = await request.json() as { id?: string }
  if (!body.id) return NextResponse.json({ ok: false, message: 'Thiếu mã thông báo.' }, { status: 400 })
  return NextResponse.json({ ok: await markPortalNotificationRead(body.id, ['admin']) })
}
