'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import { catalogItemToAudioTrack, fetchPublicMusicCatalog, type PublicMusicCatalogItem } from '@/lib/public-music-catalog'

type MusicListSection = 'genre' | 'community' | 'remix' | 'albums' | 'charts' | 'nonstop'

const sectionDetails: Record<MusicListSection, { eyebrow: string; title: string; description: string; variant: 'playlist' | 'remix' | 'track' }> = {
  genre: {
    eyebrow: 'Music catalog',
    title: 'Playlist theo dòng nhạc',
    description: 'Toàn bộ track, nonstop và remix mới nhất từ Music catalog.',
    variant: 'track',
  },
  community: {
    eyebrow: 'Community mixes',
    title: 'DJ sets cho community',
    description: 'Các DJ set đã được chọn hiển thị cho cộng đồng.',
    variant: 'playlist',
  },
  remix: {
    eyebrow: 'Trending remix',
    title: 'Tất cả Remix',
    description: 'Danh sách remix từ mới đến cũ.',
    variant: 'remix',
  },
  albums: {
    eyebrow: 'Albums and releases',
    title: 'Track từ Album và release',
    description: 'Các track thuộc album hoặc EP đã phát hành.',
    variant: 'track',
  },
  charts: {
    eyebrow: 'Music chart',
    title: 'Bảng xếp hạng nghe nhiều',
    description: 'Danh sách nhạc đang có mặt trong catalog.',
    variant: 'track',
  },
  nonstop: {
    eyebrow: 'Nonstop picks',
    title: 'Tất cả Nonstop',
    description: 'Danh sách nonstop từ mới đến cũ.',
    variant: 'playlist',
  },
}

function getSection(value: string | null): MusicListSection {
  return value && value in sectionDetails ? value as MusicListSection : 'genre'
}

function filterTracks(section: MusicListSection, tracks: PublicMusicCatalogItem[]) {
  if (section === 'nonstop') return tracks.filter((track) => track.type === 'nonstop')
  if (section === 'remix') return tracks.filter((track) => track.type === 'remix')
  if (section === 'community') return tracks.filter((track) => track.displayMap.includes('Music - DJ sets community'))
  if (section === 'albums') return tracks.filter((track) => Boolean(track.albumLabel))
  return tracks
}

export default function MusicListPage() {
  const [catalog, setCatalog] = useState<PublicMusicCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [section, setSection] = useState<MusicListSection>('genre')
  const details = sectionDetails[section]
  const tracks = useMemo(() => filterTracks(section, catalog).map(catalogItemToAudioTrack), [catalog, section])

  useEffect(() => {
    setSection(getSection(new URLSearchParams(window.location.search).get('section')))
    void fetchPublicMusicCatalog()
      .then(setCatalog)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main className="tidal-page">
      <section className="tidal-content tidal-content-list">
        <div className="tidal-section-head">
          <div>
            <p className="section-eyebrow">{details.eyebrow}</p>
            <h1>{details.title}</h1>
            <p className="section-intro">{details.description}</p>
          </div>
          <Link href="/music" className="more-link-unified">Quay lại Music</Link>
        </div>

        {isLoading ? <p className="muted">Đang tải danh sách nhạc...</p> : null}
        {!isLoading && tracks.length === 0 ? <p className="muted">Chưa có nội dung phù hợp trong catalog.</p> : null}
        {tracks.length > 0 ? (
          <AudioShowcasePlayer
            title={details.title}
            subtitle={`${tracks.length} nội dung đang hiển thị`}
            tracks={tracks}
            variant={details.variant}
          />
        ) : null}
      </section>
    </main>
  )
}
