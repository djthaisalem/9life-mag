import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { castContentVote } from '@/lib/content-votes'
import { SITE_SESSION_COOKIE, getAuthenticatedSiteSession } from '@/lib/site-user-session'

const schema = z.object({ type: z.enum(['artist', 'outlet']), slug: z.string().trim().min(1).max(120) })

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
  if (!authenticated) return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 })

  try {
    const target = schema.parse(await request.json())
    const result = await castContentVote({ userId: authenticated.session.userId, target })
    if (!result.ok) return NextResponse.json(result, { status: result.reason === 'insufficient_stars' ? 402 : 400 })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, reason: 'invalid_request' }, { status: 400 })
    console.error('Content vote failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
