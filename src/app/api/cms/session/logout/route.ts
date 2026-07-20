import { NextResponse } from 'next/server'
import { CMS_SESSION_COOKIE, getCmsSessionCookieOptions } from '@/lib/cms-session'

function clearCmsCookie(response: NextResponse) {
  response.cookies.set(CMS_SESSION_COOKIE, '', {
    ...getCmsSessionCookieOptions(),
    maxAge: 0,
  })

  return response
}

export async function GET(request: Request) {
  return clearCmsCookie(NextResponse.redirect(new URL('/cms', request.url)))
}

export async function POST() {
  return clearCmsCookie(NextResponse.json({ ok: true }))
}
