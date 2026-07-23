import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { publishSharedUserPlaylist } from '@/lib/shared-user-playlists'
import { SITE_SESSION_COOKIE, getAuthenticatedSiteSession } from '@/lib/site-user-session'

const safePathOrUrl = z.string().trim().max(2048).refine(
  (value) => !value || /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value),
  'URL media không hợp lệ.',
)
const optionalShareImage = z.string().trim().max(4_000_000).optional().transform((value) => (
  value && (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) ? value : undefined
))

const itemSchema = z.object({
  id: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().min(1).max(200),
  duration: z.string().trim().max(30),
  cover: optionalShareImage,
  audioUrl: safePathOrUrl,
  likes: z.string().trim().max(40).optional(),
  downloads: z.number().int().min(0).max(1_000_000_000).optional(),
  downloadUrl: safePathOrUrl.optional(),
  isPremiumDrop: z.boolean().optional(),
  protectedMedia: z.boolean().optional(),
  addedAt: z.string().datetime(),
  sourceType: z.enum(['track', 'nonstop', 'remix']),
}).strip()

const playlistSchema = z.object({
  id: z.string().trim().min(1).max(180),
  name: z.string().trim().min(1).max(160),
  shareCode: z.string().trim().regex(/^[a-z0-9-]{4,180}$/),
  cover: optionalShareImage,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  listens: z.number().int().min(0).max(1_000_000_000),
  rewardStars: z.number().int().min(0).max(1_000_000_000),
  favorites: z.number().int().min(0).max(1_000_000_000).optional(),
  note: z.string().trim().max(500),
  items: z.array(itemSchema).max(100),
}).strip()

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
    if (!authenticated) {
      return NextResponse.json(
        { ok: false, message: 'Bạn cần đăng nhập để xuất bản và chia sẻ playlist.' },
        { status: 401 },
      )
    }

    const playlist = playlistSchema.parse(await request.json())
    await publishSharedUserPlaylist(authenticated.session.userId, playlist)
    return NextResponse.json({
      ok: true,
      playlist,
      path: `/music/library/${playlist.shareCode}`,
      message: 'Playlist đã được đồng bộ và sẵn sàng chia sẻ.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: error.issues[0]?.message ?? 'Dữ liệu playlist chưa hợp lệ.' },
        { status: 400 },
      )
    }
    if (error instanceof Error && error.message === 'PLAYLIST_OWNER_MISMATCH') {
      return NextResponse.json(
        { ok: false, message: 'Mã chia sẻ playlist đã thuộc một tài khoản khác.' },
        { status: 409 },
      )
    }
    console.error('Publish shared playlist failed', error)
    return NextResponse.json(
      { ok: false, message: 'Chưa thể đồng bộ playlist lên hệ thống.' },
      { status: 500 },
    )
  }
}
