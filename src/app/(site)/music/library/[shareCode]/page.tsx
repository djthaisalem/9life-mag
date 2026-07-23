'use client'

import Link from 'next/link'
import { LibraryBig, Play, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useMediaPlayer } from '@/components/global-media-player'
import { copyText } from '@/lib/client-share'
import { findPlaylistByShareCode, getUserPlaylists, type UserPlaylist } from '@/lib/user-playlists'

export default function SharedPlaylistPage({ params }: { params: Promise<{ shareCode: string }> }) {
  const { playCollection } = useMediaPlayer()
  const [playlist, setPlaylist] = useState<UserPlaylist | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    void params.then(({ shareCode: nextShareCode }) => {
      setShareCode(nextShareCode)
      setPlaylist(findPlaylistByShareCode(getUserPlaylists(), nextShareCode))
    })
  }, [params])

  if (!shareCode) return null

  if (!playlist) {
    return <main className="music-library-page"><section className="music-library-shared-empty"><LibraryBig size={30} /><h1>Playlist chưa khả dụng</h1><p>Liên kết này cần được mở từ thiết bị hoặc tài khoản đã tạo playlist.</p><Link href="/music/library" className="button">Mở thư viện của bạn</Link></section></main>
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: playlist.name, url: window.location.href })
        setShareMessage('Đã mở bảng chia sẻ playlist.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    const copied = await copyText(window.location.href)
    setShareMessage(copied ? 'Đã sao chép link playlist.' : `Link playlist: ${window.location.href}`)
  }

  return <main className="music-library-page"><section className="music-library-shared-page"><img src={playlist.cover ?? playlist.items[0]?.cover ?? '/images/default-music-cover.png'} alt="" /><div><p className="eyebrow">9Life Community Playlist</p><h1>{playlist.name}</h1><p>{playlist.items.length} bản nhạc · {playlist.listens.toLocaleString('vi-VN')} lượt nghe · {playlist.favorites ?? 0} yêu thích</p><div className="music-library-hero-actions"><button type="button" className="button" disabled={!playlist.items.length} onClick={() => playCollection(playlist.items, 0, playlist.items[0]?.sourceType ?? 'track')}><Play size={16} fill="currentColor" /> Nghe playlist</button><button type="button" className="button-secondary" onClick={() => void handleShare()}><Share2 size={16} /> Chia sẻ</button></div>{shareMessage ? <p className="muted">{shareMessage}</p> : null}</div></section></main>
}
