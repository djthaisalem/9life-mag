import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getRecentPremiumAccess } from '@/lib/wallet-ledger'
import {
  SITE_SESSION_COOKIE,
  activatePremiumAccessForUser,
  getAuthenticatedSiteSession,
} from '@/lib/site-user-session'

async function getSession() {
  const cookieStore = await cookies()
  return getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
}

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, active: false, message: 'Bạn cần đăng nhập để kiểm tra quyền Premium Drop.' },
      { status: 401 },
    )
  }

  const premiumAccess = await getRecentPremiumAccess(authenticated.session.userId)
  return NextResponse.json({
    ok: true,
    active: Boolean(premiumAccess),
    premiumAccess,
  })
}

export async function POST() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, active: false, message: 'Bạn cần đăng nhập để kích hoạt Premium Drop.' },
      { status: 401 },
    )
  }

  const result = await activatePremiumAccessForUser(authenticated.session.userId)
  if (!result.ok) {
    return NextResponse.json(
      {
        ...result,
        active: false,
        message: result.reason === 'insufficient_stars'
          ? 'Bạn cần đủ 10 sao để kích hoạt Premium Drop trong 24 giờ.'
          : 'Không thể kích hoạt Premium Drop lúc này.',
      },
      { status: result.reason === 'insufficient_stars' ? 402 : 400 },
    )
  }

  return NextResponse.json({
    ...result,
    active: true,
    message: result.alreadyCharged
      ? 'Premium Drop của bạn vẫn còn hiệu lực.'
      : 'Đã kích hoạt Premium Drop trong 24 giờ.',
  })
}
