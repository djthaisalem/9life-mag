import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { loadPayloadClient } from '@/lib/payload-runtime'

const createAlbumSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_200).default(''),
  artistId: z.string().trim().min(1).optional(),
  musician: z.string().trim().max(160).default(''),
  musicCategory: z.string().trim().max(120).default(''),
  releaseDate: z.string().datetime().optional(),
  isPublic: z.boolean().default(false),
  trackIds: z.array(z.string().trim().min(1)).min(1).max(100),
})

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
  const access = await requireCmsApiAccess('music')
  if (!access.ok) return access.response

  try {
    const input = createAlbumSchema.parse(await request.json())
    const payload = await loadPayloadClient()
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

    await Promise.all(input.trackIds.map((trackId) => payload.update({
      collection: 'tracks',
      id: trackId,
      depth: 0,
      overrideAccess: true,
      data: { albumLabel: input.title },
    })))

    return NextResponse.json({
      ok: true,
      message: 'Album / EP created and selected tracks were attached.',
      album: { id: album.id, slug: album.slug, title: album.title },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Album details are invalid.' }, { status: 400 })
    }
    console.error('CMS album creation failed', error)
    return NextResponse.json({ ok: false, message: 'Unable to create Album / EP right now.' }, { status: 500 })
  }
}
