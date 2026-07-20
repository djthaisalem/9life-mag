import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  SITE_SESSION_COOKIE,
  getAuthenticatedSiteSession,
  toggleFollowedAgentForUser,
  toggleFollowedArtistForUser,
} from '@/lib/site-user-session'

const followSchema = z.object({
  slug: z.string().min(1, 'Thiếu slug cần theo dõi'),
  target: z.enum(['artist', 'agent']).default('artist'),
})

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)

    if (!authenticated) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Bạn cần đăng nhập trước khi theo dõi.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const payload = followSchema.parse(body)
    const result = payload.target === 'agent'
      ? await toggleFollowedAgentForUser(authenticated.session.userId, payload.slug)
      : await toggleFollowedArtistForUser(authenticated.session.userId, payload.slug)

    return NextResponse.json({
      ...result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu follow chưa hợp lệ.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể cập nhật follow lúc này.',
      },
      { status: 500 }
    )
  }
}
