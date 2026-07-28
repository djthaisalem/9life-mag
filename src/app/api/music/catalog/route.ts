import { NextResponse } from 'next/server'
import { loadPayloadClient } from '@/lib/payload-runtime'

type MediaValue = { id?: string | number; url?: string | null }

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
  albumLabel?: string
  accessLevel?: string
  coverImage?: MediaValue | string | number | null
}

type PublicAlbumDocument = {
  id: string | number
  slug?: string
  title?: string
  musician?: string
  artist?: { stageName?: string; slug?: string } | string | number | null
  coverImage?: MediaValue | string | number | null
  tracks?: Array<PublicTrackDocument | string | number> | null
}

function normalizeType(value?: string): 'track' | 'nonstop' | 'remix' {
  if (value === 'nonstop' || value === 'remix') return value
  return 'track'
}

export async function GET() {
  try {
    const payload = await loadPayloadClient()
    const [result, albumResult] = await Promise.all([
      payload.find({
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
        limit: 500,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'albums',
        where: { isPublic: { equals: true } },
        sort: '-updatedAt',
        limit: 100,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
    ])

    const tracks = result.docs.map((value) => {
      const track = value as PublicTrackDocument
      const coverId = typeof track.coverImage === 'object' && track.coverImage
        ? track.coverImage.id
        : track.coverImage
      const cover = coverId ? `/api/public/media/${encodeURIComponent(String(coverId))}` : undefined
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
        albumLabel: track.albumLabel || undefined,
        isPremiumDrop: track.accessLevel === 'premium',
      }
    })

    const trackById = new Map(tracks.map((track) => [track.id, track]))
    const albums = albumResult.docs.flatMap((value) => {
      const album = value as PublicAlbumDocument
      const albumTracks = (album.tracks ?? [])
        .map((track) => trackById.get(String(typeof track === 'object' && track ? track.id : track)))
        .filter((track): track is (typeof tracks)[number] => Boolean(track))
      if (!albumTracks.length) return []

      const coverId = typeof album.coverImage === 'object' && album.coverImage
        ? album.coverImage.id
        : album.coverImage
      const artist = typeof album.artist === 'object' && album.artist
        ? album.artist.stageName || album.artist.slug
        : undefined

      return [{
        id: String(album.id),
        slug: album.slug || String(album.id),
        title: album.title || 'Album',
        artist: artist || album.musician || albumTracks[0]?.artist || '9LIFE Artist',
        cover: coverId
          ? `/api/public/media/${encodeURIComponent(String(coverId))}`
          : albumTracks[0]?.cover || '/images/default-music-cover.png',
        trackIds: albumTracks.map((track) => track.id),
      }]
    })

    return NextResponse.json(
      { ok: true, tracks, albums },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (error) {
    console.error('Public music catalog failed', error)
    return NextResponse.json({ ok: false, tracks: [], message: 'Chưa thể tải catalog nhạc.' }, { status: 500 })
  }
}
