import { NextResponse } from 'next/server'
import { hasTrustedCmsRequestOrigin, requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { CMS_SESSION_COOKIE, createCmsSessionToken, getCmsSessionCookieOptions } from '@/lib/cms-session'
import { completeDirectMp3Upload, prepareDirectMp3Upload } from '@/lib/music-upload-pipeline'

export const runtime = 'nodejs'
export const maxDuration = 60

type UploadBody = {
  action?: 'prepare' | 'complete'
  title?: string
  type?: 'track' | 'nonstop' | 'remix'
  genre?: string
  artistSlug?: string
  access?: 'public' | 'stars' | 'premium' | 'internal'
  displayMap?: string
  albumLabel?: string
  visibility?: 'draft' | 'pending' | 'public' | 'hidden'
  fileName?: string
  fileSize?: number
  contentType?: string
  ticket?: string
  durationSeconds?: number
}

function refreshCmsSession(response: NextResponse, session: { email: string; role: string }) {
  return createCmsSessionToken({ email: session.email, role: session.role }).then((token) => {
    response.cookies.set(CMS_SESSION_COOKIE, token, getCmsSessionCookieOptions())
    return response
  })
}

export async function POST(request: Request) {
  if (!await hasTrustedCmsRequestOrigin()) {
    return NextResponse.json({ ok: false, message: 'Origin không hợp lệ cho thao tác nhạy cảm.' }, { status: 403 })
  }

  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'music',
  )
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('music')
  if (!access.ok) return access.response

  try {
    const body = await request.json() as UploadBody
    if (body.action === 'prepare') {
      if (!body.title?.trim() || !body.fileName || !Number.isFinite(body.fileSize) || !body.type || !body.access || !body.visibility) {
        return NextResponse.json({ ok: false, message: 'Thông tin upload chưa hợp lệ.' }, { status: 400 })
      }
      const result = await prepareDirectMp3Upload({
        title: body.title,
        type: body.type,
        genre: body.genre ?? '',
        artistSlug: body.artistSlug ?? '',
        access: body.access,
        displayMap: body.displayMap ?? '',
        albumLabel: body.albumLabel ?? '',
        visibility: body.visibility,
        fileName: body.fileName,
        fileSize: Number(body.fileSize),
        contentType: body.contentType ?? 'audio/mpeg',
        uploadedBy: access.session.email,
      })
      return refreshCmsSession(NextResponse.json({ ok: true, result }), access.session)
    }

    if (body.action === 'complete' && body.ticket) {
      const result = await completeDirectMp3Upload(body.ticket, access.session.email, Number(body.durationSeconds))
      return refreshCmsSession(NextResponse.json({ ok: true, result }), access.session)
    }

    return NextResponse.json({ ok: false, message: 'Thao tác upload không hợp lệ.' }, { status: 400 })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(':')[0] : ''
    console.error('Direct MP3 upload failed', { code, error })
    const message = code === 'direct_upload_missing_file'
      ? 'R2 chưa nhận đủ file nhạc. Vui lòng thử lại.'
      : code === 'direct_upload_ticket_expired'
        ? 'Phiên upload đã hết hạn. Vui lòng chọn file và upload lại.'
        : code === 'direct_upload_requires_mp3'
          ? 'Luồng upload trực tiếp chỉ áp dụng cho file MP3.'
          : `Không thể hoàn tất upload MP3 (${code || 'unknown_error'}).`
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
