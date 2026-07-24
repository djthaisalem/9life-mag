import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import { createShareMetadata } from '@/lib/seo'
import { loadPayloadClient } from '@/lib/payload-runtime'
import type { AudioTrack } from '@/lib/audio-types'

type MediaValue = { id?: string | number } | string | number | null | undefined
type TrackDocument = {
  id: string | number
  title?: string
  submittedArtistSlug?: string
  durationLabel?: string
  coverImage?: MediaValue
  visibility?: string
  isPublic?: boolean
}

function coverUrl(value: MediaValue) {
  const id = typeof value === 'object' && value ? value.id : value
  return id ? `/api/public/media/${encodeURIComponent(String(id))}` : '/images/default-music-cover.png'
}

async function getAlbum(albumSlug: string) {
  const payload = await loadPayloadClient()
  let result = await payload.find({ collection: 'albums', where: { slug: { equals: albumSlug } }, limit: 1, depth: 1, pagination: false, overrideAccess: true })
  if (!result.docs[0]) result = await payload.find({ collection: 'albums', where: { title: { equals: decodeURIComponent(albumSlug) } }, limit: 1, depth: 1, pagination: false, overrideAccess: true })
  return result.docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ albumSlug: string }> }): Promise<Metadata> {
  const { albumSlug } = await params
  const album = await getAlbum(albumSlug)
  if (!album || album.isPublic !== true) return {}
  const image = coverUrl(album.coverImage as MediaValue)
  return createShareMetadata({ title: `${album.title} | 9LIFE Music`, description: album.description || `Nghe trọn Album ${album.title} trên 9LIFE Music.`, path: `/music/album/${encodeURIComponent(albumSlug)}`, image })
}

export default async function AlbumPage({ params }: { params: Promise<{ albumSlug: string }> }) {
  const { albumSlug } = await params
  const album = await getAlbum(albumSlug)
  if (!album || album.isPublic !== true) notFound()

  const relationTracks = Array.isArray(album.tracks) ? album.tracks : []
  const tracks = relationTracks
    .filter((track): track is TrackDocument => typeof track === 'object' && track !== null)
    .filter((track) => track.isPublic === true && track.visibility === 'public')
    .map<AudioTrack>((track) => ({
      id: String(track.id),
      title: track.title || 'Track chưa đặt tên',
      artist: track.submittedArtistSlug || album.musician || '9LIFE Artist',
      duration: track.durationLabel || '00:00',
      cover: coverUrl(track.coverImage),
      audioUrl: '',
      protectedMedia: true,
    }))

  return <main className="music-page"><section className="tidal-section music-album-detail">
    <Link href="/music#albums" className="more-link-unified">Quay lại Music</Link>
    <div className="music-album-detail-head">
      <img src={coverUrl(album.coverImage as MediaValue)} alt={`Ảnh bìa Album ${album.title}`} />
      <div><p className="section-eyebrow">Album / EP</p><h1>{album.title}</h1><p>{album.musician || '9LIFE Artist'}</p>{album.description ? <p className="cms-muted">{album.description}</p> : null}<span>{tracks.length} track</span></div>
    </div>
    {tracks.length ? <AudioShowcasePlayer title="Tracklist" subtitle="Nghe trọn Album" tracks={tracks} variant="track" /> : <p className="cms-muted">Album này chưa có track công khai.</p>}
  </section></main>
}
