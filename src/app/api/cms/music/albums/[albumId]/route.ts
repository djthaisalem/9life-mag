import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { normalizeCmsRole } from '@/lib/cms-role-policy'

const albumTracksSchema = z.object({ trackIds: z.array(z.string().trim().min(1)).max(100) })

export async function PATCH(request: Request, context: { params: Promise<{ albumId: string }> }) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'music',
  )
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('music')
  if (!access.ok) return access.response
  if (normalizeCmsRole(access.session.role) !== 'super_admin') {
    return NextResponse.json({ ok: false, message: 'Chỉ Super Admin được thêm track vào Album / EP.' }, { status: 403 })
  }

  try {
    const { albumId } = await context.params
    const { trackIds } = albumTracksSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const album = await payload.findByID({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true })
    const existingTrackIds = Array.isArray(album.tracks)
      ? album.tracks.map((item) => typeof item === 'object' && item ? String(item.id) : String(item))
      : []
    const nextTrackIds = [...new Set(trackIds)]
    const trackResult = await payload.find({ collection: 'tracks', where: { id: { in: nextTrackIds } }, limit: nextTrackIds.length, depth: 0, pagination: false, overrideAccess: true })
    if (trackResult.docs.length !== nextTrackIds.length) return NextResponse.json({ ok: false, message: 'Có track không còn tồn tại.' }, { status: 400 })
    const albumCoverId = typeof album.coverImage === 'object' && album.coverImage
      ? String(album.coverImage.id)
      : typeof album.coverImage === 'string' ? album.coverImage : null

    await Promise.all([
      payload.update({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true, data: { tracks: nextTrackIds } }),
      ...trackResult.docs.map((track) => payload.update({ collection: 'tracks', id: track.id, depth: 0, overrideAccess: true, data: { albumLabel: album.title, trackType: 'single', coverImage: albumCoverId, visibility: album.isPublic ? 'public' : 'draft', isPublic: album.isPublic === true, status: album.isPublic ? 'published' : 'draft' } })),
      ...existingTrackIds.filter((id) => !nextTrackIds.includes(id)).map((trackId) => payload.update({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true, data: { albumLabel: undefined } })),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Track is invalid.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Unable to attach the uploaded track to this Album / EP.' }, { status: 500 })
  }
}
