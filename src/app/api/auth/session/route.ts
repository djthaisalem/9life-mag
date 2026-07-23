import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getSiteSessionCookieOptions,
  createSiteSessionToken,
  getAuthenticatedSiteSession,
  getSiteSessionSnapshot,
  SITE_SESSION_COOKIE,
} from '@/lib/site-user-session'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SITE_SESSION_COOKIE)?.value
  const snapshot = await getSiteSessionSnapshot(token)

  const response = NextResponse.json(
    {
      ...snapshot,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
  const authenticated = await getAuthenticatedSiteSession(token)
  if (authenticated) {
    const refreshedToken = await createSiteSessionToken({
      userId: authenticated.session.userId,
      accountType: authenticated.account.accountType,
    })
    response.cookies.set(SITE_SESSION_COOKIE, refreshedToken, getSiteSessionCookieOptions())
  }
  return response
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(SITE_SESSION_COOKIE, '', {
    ...getSiteSessionCookieOptions(),
    maxAge: 0,
  })

  return NextResponse.json(
    {
      ok: true,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
