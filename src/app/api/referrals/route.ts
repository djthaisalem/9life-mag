import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SITE_SESSION_COOKIE, getAuthenticatedSiteSession } from '@/lib/site-user-session'
import { createShareReferral, getReferralSummary, qualifyReferralVisit, registerReferralVisit } from '@/lib/share-referrals'
import { getTrustedClientIp, guardReferralAttempts } from '@/lib/request-guard'

const shareSchema = z.object({ action: z.literal('share'), path: z.string().min(1).max(500) })
const visitSchema = z.object({ action: z.enum(['visit', 'qualify']), token: z.string().regex(/^[a-f0-9]{32}$/i, 'Mã chia sẻ không hợp lệ.') })

async function getSession() {
  const cookieStore = await cookies()
  return getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
}

async function getVisitorKey(request: Request) {
  const cookieStore = await cookies()
  let visitorId = cookieStore.get('nine_life_share_visitor')?.value
  if (!visitorId) visitorId = crypto.randomUUID()
  // Keep qualification stable when Cloudflare or a mobile network changes the observed IP.
  return { visitorId, value: visitorId, isNew: !cookieStore.get('nine_life_share_visitor') }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để xem phần thưởng chia sẻ.' }, { status: 401 })
  return NextResponse.json({ ok: true, summary: await getReferralSummary(session.session.userId) })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (body?.action === 'share') {
      const session = await getSession()
      if (!session) return NextResponse.json({ ok: false, message: 'Hãy đăng nhập trước khi tạo link chia sẻ nhận sao.' }, { status: 401 })
      const visitor = await getVisitorKey(request)
      const ip = getTrustedClientIp(request.headers)
      const guard = await guardReferralAttempts(session.session.userId, ip, 'share')
      if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
      const input = shareSchema.parse(body)
      const result = await createShareReferral(session.session.userId, input.path, { visitorKey: visitor.value, ip })
      const response = NextResponse.json(result, { status: result.ok ? 200 : 429 })
      if (visitor.isNew) response.cookies.set('nine_life_share_visitor', visitor.visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 180, path: '/' })
      return response
    }

    const input = visitSchema.parse(body)
    const visitor = await getVisitorKey(request)
    const ip = getTrustedClientIp(request.headers)
    const guard = await guardReferralAttempts(visitor.visitorId, ip, 'visit')
    if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
    const session = await getSession()
    const result = input.action === 'visit'
      ? await registerReferralVisit(input.token, visitor.value, session?.session.userId, ip)
      : await qualifyReferralVisit(input.token, visitor.value, session?.session.userId, ip)
    const response = NextResponse.json(result)
    if (visitor.isNew) response.cookies.set('nine_life_share_visitor', visitor.visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 180, path: '/' })
    return response
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Không thể xử lý link chia sẻ lúc này.'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
