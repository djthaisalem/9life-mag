import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPreviewPlaybackUrl, getPrivateObjectUrl } from '@/lib/r2-media-access'
import { SITE_SESSION_COOKIE, accessMediaWithStars, getAuthenticatedSiteSession } from '@/lib/site-user-session'
import { getRecentPremiumAccess } from '@/lib/wallet-ledger'

type TrackDocument = { id: string | number; title?: string; musicCode?: string; sourceFormat?: string; previewR2Key?: string; masterR2Key?: string; visibility?: string; isPublic?: boolean; accessLevel?: string; requiresLoginToDownload?: boolean; playbackStarCost?: number; downloadStarCost?: number; isDownloadDisabled?: boolean }
const mediaRequestSchema = z.object({ kind: z.enum(['preview', 'download']) })

function isExpectedR2Key(key: string | undefined, prefixes: readonly string[]): key is string {
  return typeof key === 'string' && prefixes.some((prefix) => key.startsWith(prefix))
}

function getStarCost(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function getDownloadFilename(track: TrackDocument) {
  const extensionFromKey = track.masterR2Key?.match(/(\.[a-z0-9]{2,5})$/i)?.[1]
  const extension = extensionFromKey || (track.sourceFormat ? `.${track.sourceFormat.toLowerCase()}` : '.mp3')
  const title = (track.title || '9life-music').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\s+/g, ' ').trim()
  const code = track.musicCode?.replace(/\D/g, '').slice(0, 6)
  return `${title}${code ? ` - ${code}` : ''}${extension}`
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
      const cookieStore = await cookies()
      const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
      let remainingStars = authenticated?.account.stars
      if (track.accessLevel === 'premium') {
        if (!authenticated) {
          return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để mở Premium Drop.' }, { status: 401 })
        }
        const premiumAccess = await getRecentPremiumAccess(authenticated.session.userId)
        if (!premiumAccess) {
          return NextResponse.json({ ok: false, message: 'Track này cần quyền Premium Drop còn hiệu lực.' }, { status: 403 })
        }
      }
      if (!isExpectedR2Key(track.previewR2Key, ['music/preview/', 'music/master/'])) return NextResponse.json({ ok: false, message: 'Track chưa có file phát.' }, { status: 404 })
      const playbackUrl = await getPreviewPlaybackUrl(track.previewR2Key)
      const playbackCost = getStarCost(track.playbackStarCost)
      if (playbackCost > 0) {
        if (!authenticated) return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để mở track này.' }, { status: 401 })
        const result = await accessMediaWithStars(authenticated.session.userId, trackId, 'playback', playbackCost)
        if (!result.ok) return NextResponse.json({ ok: false, message: `Bạn cần ${playbackCost} sao để nghe track này.` }, { status: 402 })
        remainingStars = result.state.stars
      }
      return NextResponse.json({ ok: true, kind, url: playbackUrl, stars: remainingStars, expiresInSeconds: 60 * 30 })
    }

    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
    if (!authenticated) return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập để tải file.' }, { status: 401 })
    if (!isExpectedR2Key(track.masterR2Key, ['music/master/'])) return NextResponse.json({ ok: false, message: 'Track chưa có file master để tải.' }, { status: 404 })

    if (track.isDownloadDisabled) {
      return NextResponse.json({ ok: false, message: 'Nội dung này không cho phép tải xuống.' }, { status: 403 })
    }

    // Generate the short-lived URL first so a storage failure never charges the user.
    const downloadUrl = await getPrivateObjectUrl(
      track.masterR2Key,
      60 * 5,
      { downloadFilename: getDownloadFilename(track) },
    )

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
