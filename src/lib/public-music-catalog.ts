import type { AudioTrack } from '@/lib/audio-types'

export type PublicMusicCatalogItem = {
  id: string
  slug: string
  title: string
  artist: string
  genre: string
  duration: string
  type: 'track' | 'nonstop' | 'remix'
  displayMap: string[]
  musicCode?: string
  cover?: string
  albumLabel?: string
}

export async function fetchPublicMusicCatalog() {
  const response = await fetch('/api/music/catalog', {
    credentials: 'same-origin',
    cache: 'no-store',
  })
  if (!response.ok) return []
  const payload = await response.json() as { ok?: boolean; tracks?: PublicMusicCatalogItem[] }
  return payload.ok ? payload.tracks ?? [] : []
}

export function catalogItemToAudioTrack(item: PublicMusicCatalogItem): AudioTrack {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    duration: item.duration,
    cover: item.cover || '/images/default-music-cover.png',
    audioUrl: '',
    protectedMedia: true,
  }
}
