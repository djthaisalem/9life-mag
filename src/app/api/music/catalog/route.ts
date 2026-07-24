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
  coverImage?: { url?: string | null } | string | null
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
      depth: 1,
      overrideAccess: true,
    })

    const tracks = result.docs.map((value) => {
      const track = value as PublicTrackDocument
      const cover = typeof track.coverImage === 'object' && track.coverImage
        ? track.coverImage.url || undefined
        : undefined
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
        cover,
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
