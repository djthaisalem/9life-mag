'use client'

import Link from 'next/link'
import { Disc3, Play, Share2 } from 'lucide-react'
import { useState } from 'react'

import { useMediaPlayer } from '@/components/global-media-player'
import { copyText } from '@/lib/client-share'
import type { MusicShareData } from '@/lib/music-share-data'

export function SharedTrackClient({ data }: { data: MusicShareData | null }) {
  const { playCollection } = useMediaPlayer()
  const [shareMessage, setShareMessage] = useState('')

  if (!data) {
    return (
      <main className="music-library-page">
        <section className="music-library-shared-empty">
          <Disc3 size={30} />
          <h1>Track chưa khả dụng</h1>
          <p>Nội dung có thể đang chờ duyệt, đã được ẩn hoặc liên kết không còn tồn tại.</p>
          <Link href="/music" className="button">Khám phá Music</Link>
        </section>
      </main>
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.track.title} - ${data.track.artist}`,
          text: data.description,
          url: window.location.href,
        })
        setShareMessage('Đã mở bảng chia sẻ track.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    const copied = await copyText(window.location.href)
    setShareMessage(copied ? 'Đã sao chép link track.' : `Link track: ${window.location.href}`)
  }

  return (
    <main className="music-library-page">
      <section className="music-library-shared-page">
        <img src={data.track.cover || '/images/default-music-cover.png'} alt={`Ảnh bìa ${data.track.title}`} />
        <div>
          <p className="eyebrow">9LIFE Music Share</p>
          <h1>{data.track.title}</h1>
          <p>{data.track.artist} · {data.track.duration}</p>
          <p>{data.description}</p>
          <div className="music-library-hero-actions">
            <button type="button" className="button" onClick={() => playCollection([data.track], 0, data.sourceType)}>
              <Play size={16} fill="currentColor" /> Nghe ngay
            </button>
            <button type="button" className="button-secondary" onClick={() => void handleShare()}>
              <Share2 size={16} /> Chia sẻ
            </button>
            <Link href="/music" className="button-secondary">Mở Music</Link>
          </div>
          {shareMessage ? <p className="muted" aria-live="polite">{shareMessage}</p> : null}
        </div>
      </section>
    </main>
  )
}
