import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import { AlbumActions } from '@/components/album-actions'
import { createShareMetadata } from '@/lib/seo'
import { loadPayloadClient } from '@/lib/payload-runtime'
import type { AudioTrack } from '@/lib/audio-types'

type MediaValue = { id?: string | number } | string | number | null | undefined
type TrackDocument = {
  id: string | number
  title?: string
  submittedArtistSlug?: string
  durationLabel?: string
  genreLabel?: string
  coverImage?: MediaValue
  visibility?: string
  isPublic?: boolean
}

function coverUrl(value: MediaValue) {
  const id = typeof value === 'object' && value ? value.id : value
  return id ? `/api/public/media/${encodeURIComponent(String(id))}` : '/images/default-music-cover.png'
}

function toAudioTrack(track: TrackDocument, fallbackArtist: string): AudioTrack {
  return {
    id: String(track.id),
    title: track.title || 'Track chưa đặt tên',
    artist: track.submittedArtistSlug || fallbackArtist,
    duration: track.durationLabel || '00:00',
    cover: coverUrl(track.coverImage),
    audioUrl: '',
    protectedMedia: true,
  }
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
    .map((track) => toAudioTrack(track, album.musician || '9LIFE Artist'))
  const payload = await loadPayloadClient()
  const [albumSuggestions, trackSuggestions] = await Promise.all([
    payload.find({ collection: 'albums', where: { and: [{ isPublic: { equals: true } }, { title: { not_equals: album.title } }] }, limit: 3, depth: 1, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'tracks', where: { and: [{ isPublic: { equals: true } }, { visibility: { equals: 'public' } }] }, sort: '-updatedAt', limit: 24, depth: 1, pagination: false, overrideAccess: true }),
  ])
  const albumTrackIds = new Set(tracks.map((track) => track.id))
  const suggestedTracks = trackSuggestions.docs
    .filter((track) => !albumTrackIds.has(String(track.id)))
    .slice(0, 6)
    .map((track) => toAudioTrack(track as TrackDocument, '9LIFE Artist'))

  return <main className="music-page"><section className="tidal-section music-album-detail">
    <Link href="/music#albums" className="more-link-unified">Quay lại Music</Link>
    <div className="music-album-detail-head">
      <img src={coverUrl(album.coverImage as MediaValue)} alt={`Ảnh bìa Album ${album.title}`} />
      <div><p className="section-eyebrow">Album / EP</p><h1>{album.title}</h1><p>{album.musician || '9LIFE Artist'}</p>{album.description ? <p className="cms-muted">{album.description}</p> : null}<span>{tracks.length} track</span><AlbumActions albumId={`album:${album.id}`} title={album.title} href={`/music/album/${encodeURIComponent(album.slug || album.title)}`} tracks={tracks} sourceType="track" /></div>
    </div>
    {tracks.length ? <AudioShowcasePlayer title="Tracklist" subtitle="Nghe trọn Album" tracks={tracks} variant="track" /> : <p className="cms-muted">Album này chưa có track công khai.</p>}
    {albumSuggestions.docs.length ? <section className="music-album-discovery"><div className="tidal-section-head"><div><p className="section-eyebrow">Khám phá thêm</p><h2>Album khác có thể bạn sẽ thích</h2></div></div><div className="tidal-album-grid">{albumSuggestions.docs.map((suggestion) => <article key={suggestion.id} className="tidal-album-card"><Link href={`/music/album/${encodeURIComponent(suggestion.slug || suggestion.title)}`} className="tidal-album-cover-link"><img src={coverUrl(suggestion.coverImage as MediaValue)} alt={suggestion.title} /></Link><strong>{suggestion.title}</strong><span>{suggestion.musician || '9LIFE Artist'}</span></article>)}</div></section> : null}
    {suggestedTracks.length ? <section className="music-album-discovery"><AudioShowcasePlayer title="Khám phá thêm" subtitle="Track mới từ catalog 9LIFE Music" tracks={suggestedTracks} variant="track" /></section> : null}
  </section></main>
}
