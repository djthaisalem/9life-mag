'use client'

import Link from 'next/link'
import { LibraryBig, Play, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useMediaPlayer } from '@/components/global-media-player'
import { getUserPlaylists, recordPlaylistListen, type UserPlaylist } from '@/lib/user-playlists'

type PlaylistTab = 'all' | 'popular'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}

function PlaylistCard({ playlist, position }: { playlist: UserPlaylist; position: number }) {
  const { playCollection } = useMediaPlayer()
  const [listens, setListens] = useState(playlist.listens)
  const cover = playlist.cover ?? playlist.items[0]?.cover ?? '/images/default-music-cover.png'

  const playPlaylist = () => {
    if (!playlist.items.length) return
    const next = recordPlaylistListen(playlist.id)
    setListens(next.find((item) => item.id === playlist.id)?.listens ?? listens + 1)
    playCollection(playlist.items, 0, playlist.items[0]?.sourceType ?? 'track')
  }

  return (
    <article className="music-playlist-catalog-card">
      <span className="music-playlist-catalog-rank">{String(position + 1).padStart(2, '0')}</span>
      <img src={cover} alt="" />
      <div className="music-playlist-catalog-copy">
        <strong>{playlist.name}</strong>
        <span>{playlist.items.length} bản nhạc · {listens.toLocaleString('vi-VN')} lượt nghe</span>
        <small>Tạo ngày {formatDate(playlist.createdAt)} · {playlist.favorites ?? 0} yêu thích</small>
      </div>
      <button type="button" className="music-playlist-catalog-play" disabled={!playlist.items.length} onClick={playPlaylist} aria-label={`Nghe ${playlist.name}`}>
        <Play size={16} fill="currentColor" />
      </button>
    </article>
  )
}

export default function MusicPlaylistsPage() {
  const [activeTab, setActiveTab] = useState<PlaylistTab>('all')
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])

  useEffect(() => setPlaylists(getUserPlaylists()), [])

  const sortedPlaylists = useMemo(() => [...playlists].sort((left, right) => (
    activeTab === 'popular'
      ? right.listens - left.listens || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )), [activeTab, playlists])

  return (
    <main className="music-playlist-catalog-page">
      <section className="music-playlist-catalog-hero">
        <div>
          <p className="section-eyebrow">Community Playlists</p>
          <h1>Playlist do cộng đồng tạo</h1>
          <p>Khám phá các playlist được thành viên 9Life xây dựng, sắp xếp theo thời điểm tạo hoặc lượt nghe.</p>
        </div>
        <div className="music-playlist-catalog-actions">
          <Link href="/music" className="button-secondary">Khám phá Music</Link>
          <Link href="/music/library" className="music-playlist-library-action"><LibraryBig size={16} /> Thư viện của bạn</Link>
        </div>
      </section>

      <section className="music-playlist-catalog-panel">
        <div className="music-playlist-catalog-head">
          <div className="music-playlist-catalog-tabs" role="tablist" aria-label="Lọc playlist cộng đồng">
            <button type="button" className={activeTab === 'all' ? 'is-active' : ''} onClick={() => setActiveTab('all')}>Tất cả</button>
            <button type="button" className={activeTab === 'popular' ? 'is-active' : ''} onClick={() => setActiveTab('popular')}>Được nghe nhiều nhất</button>
          </div>
          <span>{sortedPlaylists.length} playlist</span>
        </div>

        {sortedPlaylists.length > 0 ? (
          <div className="music-playlist-catalog-list">
            {sortedPlaylists.map((playlist, index) => <PlaylistCard key={playlist.id} playlist={playlist} position={index} />)}
          </div>
        ) : (
          <div className="music-playlist-catalog-empty">
            <Sparkles size={22} />
            <strong>Chưa có playlist để hiển thị</strong>
            <p>Hãy tạo playlist đầu tiên trong Thư viện của bạn, sau đó playlist sẽ xuất hiện tại đây.</p>
            <Link href="/music/library" className="button">Tạo playlist</Link>
          </div>
        )}
      </section>
    </main>
  )
}
