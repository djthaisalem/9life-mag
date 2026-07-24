import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { loadPayloadClient } from '@/lib/payload-runtime'

const createAlbumSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_200).default(''),
  artistId: z.string().trim().min(1).optional(),
  musician: z.string().trim().max(160).default(''),
  musicCategory: z.string().trim().max(120).default(''),
  releaseDate: z.string().datetime().optional(),
  isPublic: z.boolean().default(false),
  trackIds: z.array(z.string().trim().min(1)).max(100).default([]),
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
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'album'
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'music',
  )
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('music')
  if (!access.ok) return access.response
  if (access.session.role !== 'super_admin') {
    return NextResponse.json({ ok: false, message: 'Chỉ Super Admin được tạo Album / EP từ kho track.' }, { status: 403 })
  }

  try {
    const input = createAlbumSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const cover = parseCoverDataUrl(input.coverDataUrl)
    const tracks = await payload.find({
      collection: 'tracks',
      where: { id: { in: input.trackIds } },
      limit: input.trackIds.length,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })

    if (tracks.docs.length !== input.trackIds.length) {
      return NextResponse.json({ ok: false, message: 'One or more selected tracks no longer exist.' }, { status: 400 })
    }

    const album = await payload.create({
      collection: 'albums',
      depth: 0,
      overrideAccess: true,
      data: {
        title: input.title,
        slug: `${toSlug(input.title)}-${Date.now().toString(36)}`,
        description: input.description || undefined,
        artist: input.artistId || undefined,
        musician: input.musician || undefined,
        musicCategory: input.musicCategory || undefined,
        releaseDate: input.releaseDate || undefined,
        isPublic: input.isPublic,
        tracks: input.trackIds,
        status: input.isPublic ? 'published' : 'draft',
        publishedAt: input.isPublic ? new Date().toISOString() : undefined,
        seoTitle: input.title,
        seoDescription: input.description || undefined,
      },
    })
    let albumCoverId: string | null = null

    if (cover) {
      const extension = cover.mimeType === 'image/png' ? 'png' : cover.mimeType === 'image/webp' ? 'webp' : 'jpg'
      const media = await payload.create({
        collection: 'media',
        depth: 0,
        overrideAccess: true,
        data: { alt: `${input.title} cover`, kind: 'image' },
        file: {
          data: cover.data,
          mimetype: cover.mimeType,
          name: `${toSlug(input.title)}-cover.${extension}`,
          size: cover.data.length,
        },
      })
      albumCoverId = String(media.id)
      await payload.update({ collection: 'albums', id: album.id, depth: 0, overrideAccess: true, data: { coverImage: media.id } })
    }

    const artist = input.artistId
      ? await payload.findByID({ collection: 'artists', id: input.artistId, depth: 0, overrideAccess: true })
      : null

    await Promise.all(input.trackIds.map((trackId) => payload.update({
      collection: 'tracks',
      id: trackId,
      depth: 0,
      overrideAccess: true,
      data: {
        albumLabel: input.title,
        trackType: 'single',
        coverImage: albumCoverId,
        visibility: input.isPublic ? 'public' : 'draft',
        isPublic: input.isPublic,
        status: input.isPublic ? 'published' : 'draft',
      },
    })))

    return NextResponse.json({
      ok: true,
      message: 'Đã tạo Album / EP. Bạn có thể upload từng track ngay bên dưới.',
      album: { id: album.id, slug: album.slug, title: album.title, artistSlug: artist?.slug || '', isPublic: input.isPublic },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Album details are invalid.' }, { status: 400 })
    }
    console.error('CMS album creation failed', error)
    return NextResponse.json({ ok: false, message: 'Unable to create Album / EP right now.' }, { status: 500 })
  }
}
