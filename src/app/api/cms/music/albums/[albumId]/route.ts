import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { loadPayloadClient } from '@/lib/payload-runtime'

const attachTrackSchema = z.object({ trackId: z.string().trim().min(1) })

export async function PATCH(request: Request, context: { params: Promise<{ albumId: string }> }) {
  const access = await requireCmsApiAccess('music')
  if (!access.ok) return access.response

  try {
    const { albumId } = await context.params
    const { trackId } = attachTrackSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const [album, track] = await Promise.all([
      payload.findByID({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true }),
      payload.findByID({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true }),
    ])
    const existingTrackIds = Array.isArray(album.tracks)
      ? album.tracks.map((item) => typeof item === 'object' && item ? String(item.id) : String(item))
      : []
    const trackIds = [...new Set([...existingTrackIds, String(track.id)])]

    await Promise.all([
      payload.update({ collection: 'albums', id: albumId, depth: 0, overrideAccess: true, data: { tracks: trackIds } }),
      payload.update({ collection: 'tracks', id: trackId, depth: 0, overrideAccess: true, data: { albumLabel: album.title } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Track is invalid.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Unable to attach the uploaded track to this Album / EP.' }, { status: 500 })
  }
}
