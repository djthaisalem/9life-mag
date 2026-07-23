import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  CMS_SESSION_COOKIE,
  createCmsSessionToken,
  getCmsSessionCookieOptions,
  verifyCmsSessionToken,
} from '@/lib/cms-session'

export async function GET() {
  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json(
      { ok: false, message: 'Phiên CMS không còn hợp lệ.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const response = NextResponse.json(
    { ok: true, role: session.role },
    { headers: { 'Cache-Control': 'no-store' } },
  )
  response.cookies.set(
    CMS_SESSION_COOKIE,
    await createCmsSessionToken({ email: session.email, role: session.role }),
    getCmsSessionCookieOptions(),
  )
  return response
}
