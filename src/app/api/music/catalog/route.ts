import { NextResponse } from 'next/server'
import { loadPayloadClient } from '@/lib/payload-runtime'

type PublicTrackDocument = {
  id: string | number
  slug?: string
  title?: string
  musicCode?: string
  trackType?: string
  submittedArtistSlug?: string
  genreLabel?: string
  durationLabel?: string
  displayMap?: string
}

function normalizeType(value?: string): 'track' | 'nonstop' | 'remix' {
  if (value === 'nonstop' || value === 'remix') return value
  return 'track'
}

export async function GET() {
  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'tracks',
      where: {
        and: [
          { visibility: { equals: 'public' } },
          { isPublic: { equals: true } },
          { accessLevel: { not_equals: 'internal' } },
          { previewR2Key: { exists: true } },
        ],
      },
      sort: '-updatedAt',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const tracks = result.docs.map((value) => {
      const track = value as PublicTrackDocument
      return {
        id: String(track.id),
        slug: track.slug || String(track.id),
        title: track.title || 'Chưa đặt tên',
        artist: track.submittedArtistSlug || '9LIFE Artist',
        genre: track.genreLabel || 'Music',
        duration: track.durationLabel || '00:00',
        type: normalizeType(track.trackType),
        displayMap: (track.displayMap || '').split('/').map((item) => item.trim()).filter(Boolean),
        musicCode: track.musicCode,
      }
    })

    return NextResponse.json(
      { ok: true, tracks },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (error) {
    console.error('Public music catalog failed', error)
    return NextResponse.json({ ok: false, tracks: [], message: 'Chưa thể tải catalog nhạc.' }, { status: 500 })
  }
}
