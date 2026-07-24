import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { normalizeCmsRole } from '@/lib/cms-role-policy'

const updateAlbumSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_200).default(''),
  isPublic: z.boolean().default(false),
  displayMap: z.string().trim().max(500).default(''),
  trackIds: z.array(z.string().trim().min(1)).min(1).max(100),
  coverDataUrl: z.string().max(4_500_000).optional(),
})

function parseCoverDataUrl(value?: string) {
  if (!value) return null
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
  if (!match) throw new Error('invalid_cover_image')
  const data = Buffer.from(match[2], 'base64')
  if (!data.length || data.length > 3 * 1024 * 1024) throw new Error('invalid_cover_image')
  return { data, mimeType: match[1] }
}

function toSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'album'
}

export async function PATCH(request: Request, context: { params: Promise<{ albumId: string }> }) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null, 'music')
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('music')
  if (!access.ok) return access.response
  if (normalizeCmsRole(access.session.role) !== 'super_admin') return NextResponse.json({ ok: false, message: 'Chỉ Super Admin được chỉnh sửa Album / EP.' }, { status: 403 })

  try {
    const { albumId } = await context.params
    const input = updateAlbumSchema.parse(await request.json())
    const relationTrackIds = input.trackIds.map((id) => Number(id))
    if (relationTrackIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) return NextResponse.json({ ok: false, message: 'Track không hợp lệ.' }, { status: 400 })

    const payload = await loadPayloadClient()
    const album = await payload.findByID({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true })
    const result = await payload.find({ collection: 'tracks', where: { id: { in: input.trackIds } }, limit: input.trackIds.length, depth: 0, pagination: false, overrideAccess: true })
    if (result.docs.length !== input.trackIds.length) return NextResponse.json({ ok: false, message: 'Có track không còn tồn tại.' }, { status: 400 })

    let coverImage = typeof album.coverImage === 'object' && album.coverImage ? Number(album.coverImage.id) : Number(album.coverImage)
    const cover = parseCoverDataUrl(input.coverDataUrl)
    if (cover) {
      const extension = cover.mimeType === 'image/png' ? 'png' : cover.mimeType === 'image/webp' ? 'webp' : 'jpg'
      const media = await payload.create({ collection: 'media', depth: 0, overrideAccess: true, data: { alt: `${input.title} cover`, kind: 'image' }, file: { data: cover.data, mimetype: cover.mimeType, name: `${toSlug(input.title)}-cover.${extension}`, size: cover.data.length } })
      coverImage = Number(media.id)
    }
    const hasCover = Number.isSafeInteger(coverImage) && coverImage > 0
    const previousTrackIds = Array.isArray(album.tracks) ? album.tracks.map((track) => typeof track === 'object' && track ? String(track.id) : String(track)) : []

    await payload.update({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true, data: { title: input.title, slug: `${toSlug(input.title)}-${String(album.id)}`, description: input.description || undefined, isPublic: input.isPublic, status: input.isPublic ? 'published' : 'draft', publishedAt: input.isPublic ? new Date().toISOString() : undefined, tracks: relationTrackIds, ...(hasCover ? { coverImage } : {}) } })
    for (const trackId of relationTrackIds) {
      await payload.update({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true, data: { albumLabel: input.title, trackType: 'single', displayMap: input.displayMap, visibility: input.isPublic ? 'public' : 'draft', isPublic: input.isPublic, status: input.isPublic ? 'published' : 'draft', ...(hasCover ? { coverImage } : {}) } })
    }
    for (const trackId of previousTrackIds.filter((id) => !input.trackIds.includes(id))) {
      await payload.update({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true, data: { albumLabel: undefined } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Thông tin Album chưa hợp lệ.' }, { status: 400 })
    console.error('Album update failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể lưu thay đổi Album.' }, { status: 500 })
  }
}
