'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Plus } from 'lucide-react'
import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import { useMediaPlayer } from '@/components/global-media-player'
import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'
import { artistProfiles } from '@/lib/artist-directory-data'
import { curateMusicCatalog, getFairRotation } from '@/lib/music-curation'
import { fetchPublishedUserPlaylists, getUserPlaylists, type UserPlaylist } from '@/lib/user-playlists'
import { catalogItemToAudioTrack, fetchPublicMusicCatalog, type PublicMusicCatalogItem } from '@/lib/public-music-catalog'
import {
  tidalAlbums,
  tidalFeatured,
  tidalHero,
  tidalHeroSlides,
  tidalMixes,
  tidalNonstopTracks,
  tidalRemixTracks,
  tidalSidebar,
} from '@/lib/music-frontend-data'

type PlayCollectionConfig = {
  tracks: readonly AudioTrack[]
  sourceType: AudioSourceType
}

type ArtistSpotlight = {
  name: string
  role: string
  note: string
  image: string
  href: string
  collection: PlayCollectionConfig
}

type FeaturedUserPlaylist = {
  id: string
  title: string
  subtitle: string
  cover: string
  collection: PlayCollectionConfig
}

type CommunityMix = {
  id: string
  title: string
  cover: string
  meta: string
  collection: PlayCollectionConfig
}

type GenreTab = 'all' | 'nonstop' | 'remix' | 'afterhours'

const featuredArtistRotationKey = 'nine-life-music-artist-rotation-v1'
const genreRotationPrefix = 'nine-life-music-genre-rotation-v1'
const communityPlaylistFallbacks: FeaturedUserPlaylist[] = tidalFeatured.map((item, index) => ({
  id: `community-playlist-${index + 1}`,
  title: item.title,
  subtitle: item.subtitle,
  cover: item.cover,
  collection: index % 2 === 0
    ? { tracks: tidalNonstopTracks.slice(index, index + 4), sourceType: 'nonstop' }
    : { tracks: tidalRemixTracks.slice(index, index + 4), sourceType: 'remix' }
}))

const genreTabs: { label: string; value: GenreTab }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Nonstop', value: 'nonstop' },
  { label: 'Remix', value: 'remix' },
  { label: 'After hours', value: 'afterhours' },
]

function getGenreCatalog(tab: GenreTab, nonstopTracks: readonly AudioTrack[], remixTracks: readonly AudioTrack[]) {
  if (tab === 'nonstop') return [...nonstopTracks]
  if (tab === 'remix') return [...remixTracks]
  if (tab === 'afterhours') return [...nonstopTracks.slice(3), ...remixTracks.slice(2), ...nonstopTracks.slice(0, 3)]
  return [...nonstopTracks, ...remixTracks]
}

function getFairGenreTracks(tab: GenreTab, nonstopTracks: readonly AudioTrack[], remixTracks: readonly AudioTrack[]) {
  const catalog = getGenreCatalog(tab, nonstopTracks, remixTracks)
  return curateMusicCatalog(catalog, `${genreRotationPrefix}:${tab}`)
}

export default function MusicPage() {
  const { activeTrack, playCollection, openPlaylistModal } = useMediaPlayer()
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [artistSpotlights, setArtistSpotlights] = useState<ArtistSpotlight[]>([])
  const [activeGenreTab, setActiveGenreTab] = useState<GenreTab>('all')
  const [genreTracks, setGenreTracks] = useState<AudioTrack[]>([])
  const [featuredPlaylists, setFeaturedPlaylists] = useState<FeaturedUserPlaylist[]>(communityPlaylistFallbacks)
  const [communityMixOrder, setCommunityMixOrder] = useState<string[]>([])
  const [albumOrder, setAlbumOrder] = useState<number[]>(() => tidalAlbums.map((_, index) => index))
  const [publishedCatalog, setPublishedCatalog] = useState<PublicMusicCatalogItem[]>([])
  const [publishedUserPlaylists, setPublishedUserPlaylists] = useState<UserPlaylist[]>([])
  const openedTrackIdRef = useRef('')
  const publishedNonstopTracks = useMemo(
    () => publishedCatalog.filter((track) => track.type !== 'remix').map(catalogItemToAudioTrack),
    [publishedCatalog],
  )
  const publishedRemixTracks = useMemo(
    () => publishedCatalog.filter((track) => track.type === 'remix').map(catalogItemToAudioTrack),
    [publishedCatalog],
  )
  const liveNonstopTracks = useMemo(() => [...publishedNonstopTracks, ...tidalNonstopTracks], [publishedNonstopTracks])
  const liveRemixTracks = useMemo(() => [...publishedRemixTracks, ...tidalRemixTracks], [publishedRemixTracks])
  const sidebarLinks = [
    { label: 'Trang chủ music', href: '#music-home' },
    { label: 'Dành cho bạn', href: '#for-you' },
    { label: 'Nonstop', href: '#listen-now' },
    { label: 'Remix', href: '#top-remix' },
    { label: 'Album', href: '#albums' },
    { label: 'BXH', href: '#charts' },
    { label: 'Nghệ sĩ', href: '#music-artists' },
    { label: 'Thư viện của bạn', href: '/music/library' },
  ] as const

  const communityMixCandidates = useMemo<CommunityMix[]>(() => {
    const mappedTracks = publishedCatalog
      .filter((track) => track.displayMap.includes('Music - DJ sets community'))
      .map(catalogItemToAudioTrack)

    if (mappedTracks.length) {
      return mappedTracks.map((track) => ({
        id: track.id,
        title: track.title,
        cover: track.cover ?? '/images/default-music-cover.png',
        meta: `${track.artist} · ${track.duration}`,
        collection: {
          tracks: mappedTracks,
          sourceType: publishedCatalog.find((item) => item.id === track.id)?.type ?? 'track',
        },
      }))
    }

    return tidalMixes.map((item, index) => ({
      id: `fallback-${index}`,
      title: item.title,
      cover: item.cover,
      meta: item.meta,
      collection: { tracks: tidalNonstopTracks.slice(index, index + 4), sourceType: 'nonstop' },
    }))
  }, [publishedCatalog])

  const albumCollections: readonly PlayCollectionConfig[] = [
    { tracks: tidalRemixTracks.slice(0, 3), sourceType: 'remix' },
    { tracks: tidalNonstopTracks.slice(0, 3), sourceType: 'nonstop' },
    { tracks: tidalRemixTracks.slice(2, 5), sourceType: 'remix' },
    { tracks: tidalNonstopTracks.slice(3, 6), sourceType: 'nonstop' },
  ]

  const chartRows = [
    ...liveRemixTracks.map((track) => ({ track, sourceType: 'remix' as const })),
    ...liveNonstopTracks.map((track) => ({ track, sourceType: 'nonstop' as const })),
  ].slice(0, 10).map(({ track, sourceType }, index) => ({
    rank: String(index + 1).padStart(2, '0'),
    title: track.title,
    artist: track.artist,
    plays: track.likes ?? 'Mới',
    collection: { tracks: [track], sourceType, index: 0 },
  }))

  const playSet = (config: PlayCollectionConfig, startIndex = 0) => {
    playCollection(config.tracks, startIndex, config.sourceType)
  }

  useEffect(() => {
    void Promise.all([fetchPublicMusicCatalog(), fetchPublishedUserPlaylists()])
      .then(([tracks, playlists]) => {
        setPublishedCatalog(tracks)
        setPublishedUserPlaylists(playlists)
      })
      .catch(() => {
        setPublishedCatalog([])
        setPublishedUserPlaylists([])
      })
  }, [])

  useEffect(() => {
    if (!publishedCatalog.length || typeof window === 'undefined') return
    const trackId = new URLSearchParams(window.location.search).get('track')?.trim()
    if (!trackId || openedTrackIdRef.current === trackId) return
    if (activeTrack?.id === trackId) {
      openedTrackIdRef.current = trackId
      return
    }
    const catalogItem = publishedCatalog.find((track) => track.id === trackId)
    if (!catalogItem) return

    openedTrackIdRef.current = trackId
    const track = catalogItemToAudioTrack(catalogItem)
    playCollection([track], 0, catalogItem.type === 'remix' ? 'remix' : catalogItem.type === 'nonstop' ? 'nonstop' : 'track')
    window.setTimeout(() => {
      document.querySelector('.global-media-player-shell')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 250)
  }, [activeTrack?.id, publishedCatalog, playCollection])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % tidalHeroSlides.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const uploadedArtists = artistProfiles.filter((artist) => publishedCatalog.some((track) =>
      track.artist.toLocaleLowerCase('vi-VN') === artist.slug.toLocaleLowerCase('vi-VN')
      || track.artist.toLocaleLowerCase('vi-VN').includes(artist.name.toLocaleLowerCase('vi-VN')),
    ))
    const artistBySlug = new Map(uploadedArtists.map((artist) => [artist.slug, artist]))
    const selectedArtists = getFairRotation(featuredArtistRotationKey, uploadedArtists.map((artist) => artist.slug), 4)
      .map((slug) => artistBySlug.get(slug))
      .filter((artist): artist is (typeof artistProfiles)[number] => Boolean(artist))

    setArtistSpotlights(selectedArtists.map((artist) => ({
      name: artist.name,
      role: artist.role,
      note: `${artist.genres} · Có nội dung đang phát trên 9Life Music.`,
      image: artist.image,
      href: `/nghe-si/${artist.slug}`,
      collection: {
        tracks: publishedCatalog
          .filter((track) => track.artist === artist.slug || track.artist.toLocaleLowerCase('vi-VN').includes(artist.name.toLocaleLowerCase('vi-VN')))
          .map(catalogItemToAudioTrack),
        sourceType: publishedCatalog.some((track) => track.artist === artist.slug && track.type === 'remix') ? 'remix' : 'nonstop',
      },
    })))

    const userPlaylists = publishedUserPlaylists.length
      ? publishedUserPlaylists
      : getUserPlaylists().filter((playlist) => playlist.items.length > 0)
    const candidates: FeaturedUserPlaylist[] = userPlaylists.length
      ? userPlaylists.map((playlist) => ({
        id: playlist.id,
        title: playlist.name,
        subtitle: `${playlist.items.length} bản nhạc · ${playlist.listens.toLocaleString('vi-VN')} lượt nghe`,
        cover: playlist.cover ?? playlist.items[0]?.cover ?? '/images/default-music-cover.png',
        collection: { tracks: playlist.items, sourceType: playlist.items[0]?.sourceType ?? 'track' },
      }))
      : communityPlaylistFallbacks
    const playlistById = new Map(candidates.map((playlist) => [playlist.id, playlist]))
    setFeaturedPlaylists(
      getFairRotation('nine-life-featured-user-playlists-v1', candidates.map((playlist) => playlist.id), 4)
        .map((id) => playlistById.get(id))
        .filter((playlist): playlist is FeaturedUserPlaylist => Boolean(playlist))
    )

    setCommunityMixOrder(
      getFairRotation('nine-life-community-mix-rotation-v2', communityMixCandidates.map((item) => item.id), Math.min(3, communityMixCandidates.length))
    )

    const albumIndexById = new Map<string, number>(tidalAlbums.map((item, index) => [item.title, index]))
    setAlbumOrder(
      getFairRotation('nine-life-album-release-rotation-v1', tidalAlbums.map((item) => item.title), tidalAlbums.length)
        .map((title) => albumIndexById.get(title))
        .filter((index): index is number => index !== undefined)
    )
  }, [communityMixCandidates, publishedCatalog, publishedUserPlaylists])

  useEffect(() => {
    setGenreTracks(getFairGenreTracks(activeGenreTab, liveNonstopTracks, liveRemixTracks))
  }, [activeGenreTab, liveNonstopTracks, liveRemixTracks])

  const currentHeroSlide = tidalHeroSlides[activeHeroSlide] ?? tidalHeroSlides[0]

  return (
    <main className="tidal-page">
      <div className="tidal-app-shell">
        <aside className="tidal-sidebar">
          <div className="tidal-sidebar-brand">
            <span className="tidal-diamond" />
            <strong>9Life Music</strong>
          </div>

          <nav className="tidal-sidebar-nav">
            {sidebarLinks.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={index === 0 ? 'tidal-sidebar-link tidal-sidebar-link-active' : 'tidal-sidebar-link'}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section className="tidal-content" id="music-home">
          <section className="tidal-hero">
            <div className="tidal-hero-grid">
              <div className="tidal-hero-copy">
                <p className="section-eyebrow">{tidalHero.eyebrow}</p>
                <h1>{tidalHero.title}</h1>
                <p className="section-intro">{tidalHero.summary}</p>
                <div className="tidal-actions">
                  <a href="#listen-now" className="button">
                    Nghe ngay
                  </a>
                  <a href="#top-remix" className="button-secondary">
                    Mở Top Remix
                  </a>
                </div>
              </div>

              <article className="tidal-hero-card">
                <div className="tidal-hero-stage">
                  <img src={currentHeroSlide.cover} alt={currentHeroSlide.title} />
                  <div className="tidal-hero-overlay">
                    <span className="pill">{currentHeroSlide.badge}</span>
                    <strong>{currentHeroSlide.title}</strong>
                    <p>{currentHeroSlide.subtitle}</p>
                    <button
                      type="button"
                      className="tidal-play-chip"
                      onClick={() => playSet(currentHeroSlide)}
                    >
                      <Play size={14} />
                      Play
                    </button>
                  </div>
                </div>

                <div className="tidal-hero-slider-nav">
                  {tidalHeroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={index === activeHeroSlide ? 'tidal-hero-thumb tidal-hero-thumb-active' : 'tidal-hero-thumb'}
                      onClick={() => setActiveHeroSlide(index)}
                      aria-label={`Mở slide ${index + 1}: ${slide.title}`}
                    >
                      <img src={slide.cover} alt={slide.title} />
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="tidal-section" id="for-you">
            <div className="tidal-section-head">
              <div>
                <p className="section-eyebrow">Community playlists</p>
                <h2>Playlist User Nổi bật</h2>
              </div>
              <Link href="/music/playlists" className="more-link-unified">Xem tất cả playlist</Link>
            </div>

            <div className="tidal-feature-grid">
              {featuredPlaylists.map((item) => (
                <article key={item.title} className="tidal-feature-card">
                  <img src={item.cover} alt={item.title} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <button
                    type="button"
                    className="tidal-play-chip tidal-play-chip-card"
                    onClick={() => playSet(item.collection)}
                  >
                    <Play size={14} />
                    Play
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="tidal-section">
            <div className="tidal-section-head">
              <div>
                <p className="section-eyebrow">Genre Channels</p>
                <h2>Playlist theo dòng nhạc</h2>
              </div>
              <a href="#listen-now" className="more-link-unified">
                Xem thêm
              </a>
            </div>

            <div className="music-genre-box">
              <div className="music-genre-controls">
                <div className="music-genre-tabs" role="tablist" aria-label="Lọc playlist theo dòng nhạc">
                  {genreTabs.map((tab) => (
                    <button key={tab.value} type="button" className={activeGenreTab === tab.value ? 'music-genre-tab music-genre-tab-active' : 'music-genre-tab'} onClick={() => setActiveGenreTab(tab.value)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="music-genre-play-all" onClick={() => playCollection(genreTracks, 0, activeGenreTab === 'remix' ? 'remix' : 'nonstop')} disabled={genreTracks.length === 0}>
                  <Play size={14} fill="currentColor" /> Nghe tất cả
                </button>
              </div>
              <div className="music-genre-list">
                {genreTracks.map((track, index) => (
                  <article key={track.id} className="music-genre-row">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <img src={track.cover ?? '/music-legacy/bg/14.jpg'} alt="" />
                    <div><strong>{track.title}</strong><p>{track.artist}</p></div>
                    <small>{track.duration}</small>
                    <div className="music-genre-row-actions"><button type="button" className="tidal-play-chip tidal-play-chip-inline" onClick={() => playCollection([track], 0, track.id.includes('remix') ? 'remix' : 'nonstop')}><Play size={14} /></button><button type="button" className="music-genre-add" onClick={() => openPlaylistModal(track, track.id.includes('remix') ? 'remix' : 'nonstop')} aria-label={`Thêm ${track.title} vào playlist`}><Plus size={14} /></button></div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="tidal-section tidal-split">
            <div>
              <div className="tidal-section-head">
                <div>
                  <p className="section-eyebrow">Mixes</p>
                  <h2>DJ sets cho community</h2>
                </div>
                <a href="#listen-now" className="more-link-unified">
                  Xem thêm
                </a>
              </div>

              <div className="tidal-mix-grid">
                {communityMixOrder.map((id) => {
                  const item = communityMixCandidates.find((candidate) => candidate.id === id)
                  if (!item) return null
                  return (
                  <article key={item.id} className="tidal-mix-card">
                    <img src={item.cover} alt={item.title} />
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                    <button
                      type="button"
                      className="tidal-play-chip tidal-play-chip-card"
                      onClick={() => playSet(item.collection, Math.max(0, item.collection.tracks.findIndex((track) => track.id === item.id)))}
                    >
                      <Play size={14} />
                      Play
                    </button>
                  </article>
                  )
                })}
              </div>
            </div>

            <div id="top-remix">
              <div className="tidal-section-head">
                <div>
                  <p className="section-eyebrow">Trending Remix</p>
                  <h2>Remix đang lên</h2>
                </div>
                <a href="#top-remix" className="more-link-unified">
                  Xem thêm
                </a>
              </div>

              <div className="tidal-remix-rail tidal-remix-rail-compact">
                {liveRemixTracks.slice(0, 5).map((item, index) => (
                  <article key={item.title} className="tidal-remix-row">
                    <span className="tidal-remix-rank">0{index + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.artist}</p>
                    </div>
                    <button
                      type="button"
                      className="tidal-play-chip tidal-play-chip-inline"
                      onClick={() => playCollection(liveRemixTracks, index, 'remix')}
                    >
                      <Play size={14} />
                    </button>
                    <span>{item.likes}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="tidal-section" id="albums">
            <div className="tidal-section-head">
              <div>
                <p className="section-eyebrow">Albums</p>
                <h2>Album và release spotlight</h2>
              </div>
              <a href="#listen-now" className="more-link-unified">
                Xem thêm
              </a>
            </div>

            <div className="tidal-album-grid">
              {albumOrder.map((index) => {
                const item = tidalAlbums[index]
                if (!item) return null
                return (
                <article key={item.title} className="tidal-album-card">
                  <img src={item.cover} alt={item.title} />
                  <strong>{item.title}</strong>
                  <span>{item.artist}</span>
                  <button
                    type="button"
                    className="tidal-play-chip tidal-play-chip-card"
                    onClick={() => playSet(albumCollections[index] ?? albumCollections[0])}
                  >
                    <Play size={14} />
                    Play
                  </button>
                </article>
                )
              })}
            </div>
          </section>

          <section className="tidal-section" id="charts">
            <div className="tidal-section-head">
              <div>
                <p className="section-eyebrow">BXH</p>
                <h2>Bảng xếp hạng nghe nhiều</h2>
              </div>
              <a href="#charts" className="more-link-unified">
                Xem thêm
              </a>
            </div>

            <div className="tidal-remix-rail tidal-chart-grid">
              {chartRows.map((item) => (
                <article key={item.rank + item.title} className="tidal-remix-row">
                  <span className="tidal-remix-rank">{item.rank}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.artist}</p>
                  </div>
                  <button
                    type="button"
                    className="tidal-play-chip tidal-play-chip-inline"
                    onClick={() => playCollection(item.collection.tracks, item.collection.index, item.collection.sourceType)}
                  >
                    <Play size={14} />
                  </button>
                  <span>{item.plays}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="tidal-section" id="music-artists">
            <div className="tidal-section-head">
              <div>
                <p className="section-eyebrow">Nghệ sĩ</p>
                <h2>Artist spotlight trong music</h2>
              </div>
              <a href="/nghe-si" className="more-link-unified">
                Xem thêm
              </a>
            </div>

            <div className="tidal-feature-grid">
              {artistSpotlights.map((item) => (
                <article key={item.name} className="tidal-feature-card">
                  <Link href={item.href} className="tidal-artist-avatar-link" aria-label={`Mở profile ${item.name}`}>
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                    <p className="tidal-artist-note">{item.note}</p>
                  </div>
                  <div className="tidal-artist-actions">
                    <button
                      type="button"
                      className="tidal-play-chip tidal-play-chip-card"
                      onClick={() => playSet(item.collection)}
                    >
                      <Play size={14} />
                      Play
                    </button>
                    <Link href={item.href} className="more-link-unified tidal-artist-link">
                      Profile
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="tidal-section tidal-player-dual" id="listen-now">
            <div className="tidal-player-panel">
              <div className="tidal-section-head">
                <div>
                  <p className="section-eyebrow">Playlist</p>
                  <h2>Nonstop picks</h2>
                </div>
                <a href="#listen-now" className="more-link-unified">
                  Xem thêm
                </a>
              </div>
              <AudioShowcasePlayer
                title="Nonstop Playlist"
                subtitle="Nhiều nonstop hơn để user lướt nhanh ngay trên tab music."
                tracks={liveNonstopTracks}
                density="compact"
              />
            </div>

            <div className="tidal-player-panel">
              <div className="tidal-section-head">
                <div>
                  <p className="section-eyebrow">Remix</p>
                  <h2>Top Remix</h2>
                </div>
                <a href="#top-remix" className="more-link-unified">
                  Xem thêm
                </a>
              </div>
              <AudioShowcasePlayer
                title="Top Remix"
                subtitle="List remix dày hơn để tận dụng chiều ngang tốt hơn."
                tracks={liveRemixTracks}
                variant="remix"
                density="compact"
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
