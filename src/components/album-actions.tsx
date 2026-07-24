'use client'

import { Heart, Play, Share2 } from 'lucide-react'
import { useState } from 'react'

import { useMediaPlayer } from '@/components/global-media-player'
import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'
import { copyText } from '@/lib/client-share'

const FAVORITE_ALBUMS_KEY = 'nine-life-favorite-albums'

function readFavorites() {
  try {
    return JSON.parse(window.localStorage.getItem(FAVORITE_ALBUMS_KEY) ?? '[]') as string[]
  } catch {
    return [] as string[]
  }
}

export function AlbumActions({ albumId, title, href, tracks, sourceType, compact = false }: {
  albumId: string
  title: string
  href: string
  tracks: readonly AudioTrack[]
  sourceType: AudioSourceType
  compact?: boolean
}) {
  const { playCollection } = useMediaPlayer()
  const [favorite, setFavorite] = useState(() => typeof window !== 'undefined' && readFavorites().includes(albumId))
  const [feedback, setFeedback] = useState('')

  const toggleFavorite = () => {
    const next = !favorite
    setFavorite(next)
    const favorites = readFavorites()
    const updated = next ? [...new Set([...favorites, albumId])] : favorites.filter((id) => id !== albumId)
    window.localStorage.setItem(FAVORITE_ALBUMS_KEY, JSON.stringify(updated))
  }

  const share = async () => {
    const url = new URL(href, window.location.origin).toString()
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} | 9LIFE Music`, text: `Nghe Album ${title} trên 9LIFE Music`, url })
        return
      }
      const copied = await copyText(url)
      setFeedback(copied ? 'Đã sao chép link Album.' : 'Không thể sao chép link lúc này.')
    } catch {
      // The share dialog may be cancelled without being an error to the user.
    }
  }

  return <div className={compact ? 'album-actions album-actions-compact' : 'album-actions'}>
    <button type="button" className="tidal-play-chip tidal-play-chip-card" disabled={!tracks.length} onClick={() => playCollection(tracks, 0, sourceType)}><Play size={14} />Nghe hết</button>
    <button type="button" className={favorite ? 'album-action-icon album-action-icon-active' : 'album-action-icon'} onClick={toggleFavorite} aria-label="Yêu thích Album" title="Yêu thích Album"><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button>
    <button type="button" className="album-action-icon" onClick={() => void share()} aria-label="Chia sẻ Album" title="Chia sẻ Album"><Share2 size={16} /></button>
    {feedback ? <span className="album-action-feedback">{feedback}</span> : null}
  </div>
}
