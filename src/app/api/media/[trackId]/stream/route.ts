import { Readable } from 'node:stream'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPrivateObjectStream } from '@/lib/r2-media-access'
import { SITE_SESSION_COOKIE, getAuthenticatedSiteSession } from '@/lib/site-user-session'
import { getRecentPremiumAccess, hasRecentMediaStarCharge } from '@/lib/wallet-ledger'

type TrackDocument = {
  id: string | number
  previewR2Key?: string
  visibility?: string
  isPublic?: boolean
  accessLevel?: string
  playbackStarCost?: number
}

function isPlaybackKey(key: string | undefined): key is string {
  return typeof key === 'string' && (key.startsWith('music/preview/') || key.startsWith('music/master/'))
}

function toWebStream(body: NonNullable<Awaited<ReturnType<typeof getPrivateObjectStream>>['Body']>) {
  if ('transformToWebStream' in body && typeof body.transformToWebStream === 'function') {
    return body.transformToWebStream()
  }

  return Readable.toWeb(body as unknown as Readable) as ReadableStream
}

export async function GET(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params

  try {
    const payload = await loadPayloadClient()
    const track = await payload.findByID({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true }) as TrackDocument
    if (track.visibility !== 'public' || track.isPublic !== true || track.accessLevel === 'internal' || !isPlaybackKey(track.previewR2Key)) {
      return NextResponse.json({ ok: false, message: 'Track không khả dụng.' }, { status: 404 })
    }

    const cookieStore = await cookies()
    const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)
    if (track.accessLevel === 'premium') {
      if (!authenticated || !await getRecentPremiumAccess(authenticated.session.userId)) {
        return NextResponse.json({ ok: false, message: 'Premium Drop không còn hiệu lực.' }, { status: 403 })
      }
    }

    const playbackCost = Math.max(0, Math.floor(track.playbackStarCost ?? 0))
    if (playbackCost > 0) {
      if (!authenticated) return NextResponse.json({ ok: false, message: 'Cần đăng nhập để phát track này.' }, { status: 401 })
      const hasAccess = await hasRecentMediaStarCharge(authenticated.session.userId, trackId, 'spend_playback', 24 * 60 * 60 * 1000)
      if (!hasAccess) return NextResponse.json({ ok: false, message: 'Quyền phát chưa được cấp.' }, { status: 403 })
    }

    const object = await getPrivateObjectStream(track.previewR2Key, request.headers.get('range'))
    if (!object.Body) throw new Error('r2_media_body_missing')

    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Type': object.ContentType || 'audio/mpeg',
    })
    if (object.ContentLength !== undefined) headers.set('Content-Length', String(object.ContentLength))
    if (object.ContentRange) headers.set('Content-Range', object.ContentRange)
    if (object.ETag) headers.set('ETag', object.ETag)

    return new NextResponse(toWebStream(object.Body), {
      status: object.ContentRange ? 206 : 200,
      headers,
    })
  } catch (error) {
    console.error('Media stream failed', { trackId, error })
    return NextResponse.json({ ok: false, message: 'Không thể mở luồng phát nhạc lúc này.' }, { status: 502 })
  }
}
