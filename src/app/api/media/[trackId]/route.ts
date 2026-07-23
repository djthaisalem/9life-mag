import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPreviewPlaybackUrl, getPrivateObjectUrl } from '@/lib/r2-media-access'
import { SITE_SESSION_COOKIE, accessMediaWithStars, getAuthenticatedSiteSession } from '@/lib/site-user-session'

type TrackDocument = { id: string | number; previewR2Key?: string; masterR2Key?: string; visibility?: string; isPublic?: boolean; accessLevel?: string; requiresLoginToDownload?: boolean; playbackStarCost?: number; downloadStarCost?: number }
const mediaRequestSchema = z.object({ kind: z.enum(['preview', 'download']) })

function isExpectedR2Key(key: string | undefined, prefixes: readonly string[]): key is string {
  return typeof key === 'string' && prefixes.some((prefix) => key.startsWith(prefix))
}

function getStarCost(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export async function POST(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params

  try {
    const { kind } = mediaRequestSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const track = await payload.findByID({ collection: 'tracks', id: trackId, depth: 0 }) as TrackDocument
    if (track.visibility !== 'public' || track.isPublic !== true || track.accessLevel === 'internal') {
      return NextResponse.json({ ok: false, message: 'Nội dung này hiện không khả dụng.' }, { status: 404 })
    }

    if (kind === 'preview') {
      if (track.accessLevel === 'premium') return NextResponse.json({ ok: false, message: 'Track này cần quyền Premium.' }, { status: 403 })
      if (!isExpectedR2Key(track.previewR2Key, ['music/preview/', 'music/master/'])) return NextResponse.json({ ok: false, message: 'Track chưa có file phát.' }, { status: 404 })
      const playbackUrl = await getPreviewPlaybackUrl(track.previewR2Key)
      const playbackCost = getStarCost(track.playbackStarCost)
      if (playbackCost > 0) {
        const cookieStore = await cookies()
        const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
        if (!authenticated) return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để mở track này.' }, { status: 401 })
        const result = await accessMediaWithStars(authenticated.session.userId, trackId, 'playback', playbackCost)
        if (!result.ok) return NextResponse.json({ ok: false, message: `Bạn cần ${playbackCost} sao để nghe track này.` }, { status: 402 })
      }
      return NextResponse.json({ ok: true, kind, url: playbackUrl, expiresInSeconds: 60 * 30 })
    }

    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
    if (!authenticated) return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để tải file.' }, { status: 401 })
    if (!isExpectedR2Key(track.masterR2Key, ['music/master/'])) return NextResponse.json({ ok: false, message: 'Track chưa có file master để tải.' }, { status: 404 })

    // Generate the short-lived URL first so a storage failure never charges the user.
    const downloadUrl = await getPrivateObjectUrl(track.masterR2Key, 60 * 5)

    const downloadCost = getStarCost(track.downloadStarCost)
    if (downloadCost > 0) {
      const result = await accessMediaWithStars(authenticated.session.userId, trackId, 'download', downloadCost)
      if (!result.ok) return NextResponse.json({ ok: false, message: `Bạn cần ${downloadCost} sao để tải file.` }, { status: 402 })
    }
    return NextResponse.json({ ok: true, kind, url: downloadUrl, expiresInSeconds: 60 * 5 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Yêu cầu media không hợp lệ.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Không thể cấp quyền media lúc này.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, message: 'Hãy dùng thao tác cấp quyền media bảo mật.' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}
