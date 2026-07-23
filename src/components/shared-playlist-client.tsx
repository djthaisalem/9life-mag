'use client'

import Link from 'next/link'
import { LibraryBig, Play, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useMediaPlayer } from '@/components/global-media-player'
import { copyText } from '@/lib/client-share'
import { findPlaylistByShareCode, getUserPlaylists, type UserPlaylist } from '@/lib/user-playlists'

export function SharedPlaylistClient({
  initialPlaylist,
  shareCode,
}: {
  initialPlaylist: UserPlaylist | null
  shareCode: string
}) {
  const { playCollection } = useMediaPlayer()
  const [playlist, setPlaylist] = useState<UserPlaylist | null>(initialPlaylist)
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (!initialPlaylist) {
      setPlaylist(findPlaylistByShareCode(getUserPlaylists(), shareCode))
    }
  }, [initialPlaylist, shareCode])

  if (!playlist) {
    return (
      <main className="music-library-page">
        <section className="music-library-shared-empty">
          <LibraryBig size={30} />
          <h1>Playlist chưa khả dụng</h1>
          <p>Playlist chưa được chủ sở hữu xuất bản hoặc liên kết không còn tồn tại.</p>
          <Link href="/music/playlists" className="button">Khám phá playlist khác</Link>
        </section>
      </main>
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist.name,
          text: playlist.note || `Nghe playlist ${playlist.name} trên 9LIFE Music`,
          url: window.location.href,
        })
        setShareMessage('Đã mở bảng chia sẻ playlist.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    const copied = await copyText(window.location.href)
    setShareMessage(copied ? 'Đã sao chép link playlist.' : `Link playlist: ${window.location.href}`)
  }

  return (
    <main className="music-library-page">
      <section className="music-library-shared-page">
        <img
          src={playlist.cover ?? playlist.items[0]?.cover ?? '/images/default-music-cover.png'}
          alt={`Ảnh bìa playlist ${playlist.name}`}
        />
        <div>
          <p className="eyebrow">9LIFE Community Playlist</p>
          <h1>{playlist.name}</h1>
          <p>{playlist.note}</p>
          <p>{playlist.items.length} bản nhạc · {playlist.listens.toLocaleString('vi-VN')} lượt nghe · {playlist.favorites ?? 0} yêu thích</p>
          <div className="music-library-hero-actions">
            <button
              type="button"
              className="button"
              disabled={!playlist.items.length}
              onClick={() => playCollection(playlist.items, 0, playlist.items[0]?.sourceType ?? 'track')}
            >
              <Play size={16} fill="currentColor" /> Nghe playlist
            </button>
            <button type="button" className="button-secondary" onClick={() => void handleShare()}>
              <Share2 size={16} /> Chia sẻ
            </button>
          </div>
          {shareMessage ? <p className="muted" aria-live="polite">{shareMessage}</p> : null}
        </div>
      </section>
    </main>
  )
}
