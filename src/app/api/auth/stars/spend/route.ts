import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SITE_SESSION_COOKIE,
  getAuthenticatedSiteSession,
  spendStarsForUser,
} from '@/lib/site-user-session'

const spendSchema = z.object({
  amount: z.number().int().min(1).max(10),
  purpose: z.enum(['general', 'vote', 'playback', 'download']).optional(),
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)

    if (!authenticated) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'not_authenticated',
          message: 'Bạn cần đăng nhập trước khi dùng sao.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const payload = spendSchema.parse(body)
    const eventTypeByPurpose = {
      general: 'spend_general',
      vote: 'spend_vote',
      playback: 'spend_playback',
      download: 'spend_download',
    } as const
    const eventType = eventTypeByPurpose[payload.purpose ?? 'general']
    const result = await spendStarsForUser(authenticated.session.userId, payload.amount, eventType)

    return NextResponse.json({
      ...result,
      message: result.ok ? 'Đã trừ sao thành công.' : 'Số sao hiện tại không đủ.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Yêu cầu trừ sao chưa hợp lệ.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể trừ sao lúc này.',
      },
      { status: 500 }
    )
  }
}
