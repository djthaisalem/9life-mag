import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasTrustedCmsRequestOrigin, requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { CMS_SESSION_COOKIE, createCmsSessionToken, getCmsSessionCookieOptions } from '@/lib/cms-session'
import { loadPayloadClient } from '@/lib/payload-runtime'

const updateMusicSchema = z.object({
  title: z.string().trim().min(1).max(180),
  type: z.enum(['track', 'nonstop', 'remix', 'album']),
  genre: z.string().trim().max(120),
  artistSlug: z.string().trim().max(180),
  access: z.enum(['public', 'stars', 'premium', 'internal']),
  visibility: z.enum(['draft', 'pending', 'public', 'hidden']),
  durationLabel: z.string().trim().max(20),
  playbackStarCost: z.number().int().min(0).max(1_000_000),
  downloadStarCost: z.number().int().min(0).max(1_000_000),
  albumLabel: z.string().trim().max(180),
  displayMap: z.array(z.string().trim().min(1).max(120)).max(12),
})

async function requireMusicAccess(request: Request) {
  if (!await hasTrustedCmsRequestOrigin()) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: 'Origin không hợp lệ cho thao tác nhạy cảm.' }, { status: 403 }),
    }
  }

  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'music',
  )
  if (capability) return { ok: true as const, principal: capability }

  const access = await requireCmsApiAccess('music')
  return access.ok
    ? { ok: true as const, principal: access.session }
    : { ok: false as const, response: access.response }
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const access = await requireMusicAccess(request)
  if (!access.ok) return access.response

  try {
    const { slug } = await context.params
    const input = updateMusicSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const existing = await payload.find({
      collection: 'tracks',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const track = existing.docs[0]

    if (!track) {
      return NextResponse.json(
        { ok: false, message: 'Đây là dữ liệu mẫu hoặc track không còn tồn tại trong database.' },
        { status: 404 },
      )
    }

    const updated = await payload.update({
      collection: 'tracks',
      id: track.id,
      depth: 0,
      overrideAccess: true,
      data: {
        title: input.title,
        trackType: input.type === 'track' ? 'single' : input.type,
        genreLabel: input.genre,
        submittedArtistSlug: input.artistSlug,
        accessLevel: input.access,
        visibility: input.visibility,
        isPublic: input.visibility === 'public',
        status: input.visibility === 'public' ? 'published' : 'draft',
        durationLabel: input.durationLabel,
        playbackStarCost: input.playbackStarCost,
        downloadStarCost: input.downloadStarCost,
        albumLabel: input.albumLabel,
        displayMap: input.displayMap.join(' / '),
      },
    })

    const response = NextResponse.json({
      ok: true,
      message: input.visibility === 'draft' ? 'Đã lưu track vào bản nháp.' : 'Đã lưu thay đổi track.',
      track: { id: updated.id, slug: updated.slug, updatedAt: updated.updatedAt },
    })
    response.cookies.set(
      CMS_SESSION_COOKIE,
      await createCmsSessionToken({ email: access.principal.email, role: access.principal.role }),
      getCmsSessionCookieOptions(),
    )
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Thông tin chỉnh sửa chưa hợp lệ. Vui lòng kiểm tra lại các trường.' }, { status: 400 })
    }
    console.error('CMS music update failed', error)
    return NextResponse.json({ ok: false, message: 'Server chưa thể lưu thay đổi track lúc này.' }, { status: 500 })
  }
}
