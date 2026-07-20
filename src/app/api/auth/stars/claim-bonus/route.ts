import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  claimBonusStarsForUser,
  getAuthenticatedSiteSession,
  SITE_SESSION_COOKIE,
} from '@/lib/site-user-session'

export async function POST() {
  const cookieStore = await cookies()
  const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)

  if (!authenticated) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'not_authenticated',
        message: 'Bạn cần đăng nhập trước khi nhận sao bonus.',
      },
      { status: 401 }
    )
  }

  const result = await claimBonusStarsForUser(authenticated.session.userId)

  return NextResponse.json({
    ...result,
    message: result.ok ? 'Đã nhận +5 sao bonus.' : 'Bonus chưa mở hoặc bạn đã nhận rồi.',
  })
}
