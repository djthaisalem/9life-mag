import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getSiteSessionCookieOptions,
  getSiteSessionSnapshot,
  SITE_SESSION_COOKIE,
} from '@/lib/site-user-session'

export async function GET() {
  const cookieStore = await cookies()
  const snapshot = await getSiteSessionSnapshot(cookieStore.get(SITE_SESSION_COOKIE)?.value)

  return NextResponse.json(
    {
      ...snapshot,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
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
