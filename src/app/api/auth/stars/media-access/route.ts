import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SITE_SESSION_COOKIE, accessMediaWithStars, getAuthenticatedSiteSession } from '@/lib/site-user-session'

const mediaAccessSchema = z.object({
  trackId: z.string().trim().min(1).max(160),
  kind: z.enum(['playback', 'download']),
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
    if (!authenticated) {
      return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 })
    }

    const input = mediaAccessSchema.parse(await request.json())
    const result = await accessMediaWithStars(authenticated.session.userId, input.trackId, input.kind, 1)
    return NextResponse.json({
      ...result,
      charged: result.ok && !('alreadyCharged' in result && result.alreadyCharged),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, reason: 'server_error', message: 'Yêu cầu media không hợp lệ.' },
        { status: 400 },
      )
    }

    console.error('Media star access failed', error)
    return NextResponse.json(
      {
        ok: false,
        reason: 'server_error',
        message: 'Không thể xác thực quyền phát nhạc lúc này. Vui lòng thử lại sau.',
      },
      { status: 500 },
    )
  }
}
