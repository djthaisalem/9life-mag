import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getSiteSessionCookieOptions,
  getSiteSessionCookieName,
  createSiteSessionToken,
  getAuthenticatedSiteSession,
  getSiteSessionSnapshot,
  type SiteAccountType,
} from '@/lib/site-user-session'

function accountTypeFromRequest(request: Request): SiteAccountType {
  return new URL(request.url).searchParams.get('accountType') === 'artist' ? 'artist' : 'user'
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const accountType = accountTypeFromRequest(request)
  const cookieName = getSiteSessionCookieName(accountType)
  const token = cookieStore.get(cookieName)?.value
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
    response.cookies.set(cookieName, refreshedToken, getSiteSessionCookieOptions())
  }
  return response
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  cookieStore.set(getSiteSessionCookieName(accountTypeFromRequest(request)), '', {
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
