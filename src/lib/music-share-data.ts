import 'server-only'

import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'
import { nonstopTracks, remixTracks } from '@/lib/music-store-data'
import { loadPayloadClient } from '@/lib/payload-runtime'

type TrackDocument = {
  id: string | number
  title?: string
  submittedArtistSlug?: string
  author?: string
  durationLabel?: string
  trackType?: string
  accessLevel?: string
  visibility?: string
  isPublic?: boolean
  previewR2Key?: string
  description?: string
}

export type MusicShareData = {
  track: AudioTrack
  sourceType: AudioSourceType
  description: string
}

function sourceTypeFromValue(value?: string): AudioSourceType {
  if (value === 'nonstop' || value === 'remix') return value
  return 'track'
}

export async function getMusicShareData(trackId: string): Promise<MusicShareData | null> {
  const staticTrack = [...nonstopTracks, ...remixTracks].find((track) => track.id === trackId)
  if (staticTrack) {
    return {
      track: { ...staticTrack },
      sourceType: nonstopTracks.some((track) => track.id === trackId) ? 'nonstop' : 'remix',
      description: `Nghe ${staticTrack.title} của ${staticTrack.artist} trên 9LIFE Music.`,
    }
  }

  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'tracks',
      where: {
        and: [
          { id: { equals: trackId } },
          { visibility: { equals: 'public' } },
          { isPublic: { equals: true } },
          { accessLevel: { not_equals: 'internal' } },
          { previewR2Key: { exists: true } },
        ],
      },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    const document = result.docs[0] as TrackDocument | undefined
    if (!document) return null

    const title = document.title || '9LIFE Music'
    const artist = document.submittedArtistSlug || document.author || '9LIFE Artist'
    return {
      track: {
        id: String(document.id),
        title,
        artist,
        duration: document.durationLabel || '00:00',
        cover: '/images/default-music-cover.png',
        audioUrl: '',
        protectedMedia: true,
        isPremiumDrop: document.accessLevel === 'premium',
      },
      sourceType: sourceTypeFromValue(document.trackType),
      description: document.description || `Nghe ${title} của ${artist} trên 9LIFE Music.`,
    }
  } catch (error) {
    console.error('Music share data query failed', error)
    return null
  }
}
