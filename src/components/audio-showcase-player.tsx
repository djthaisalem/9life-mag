'use client'

import { AlertTriangle, Download, Heart, ListPlus, Play, Plus, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMediaPlayer } from '@/components/global-media-player'
import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'

type AudioShowcasePlayerProps = {
  title: string
  subtitle: string
  tracks: readonly AudioTrack[]
  variant?: 'playlist' | 'remix'
  density?: 'default' | 'compact'
}

export type { AudioTrack } from '@/lib/audio-types'

export function AudioShowcasePlayer({
  title,
  subtitle,
  tracks,
  variant = 'playlist',
  density = 'default',
}: AudioShowcasePlayerProps) {
  const {
    activeTrack,
    activeIndex,
    isPlaying,
    playCollection,
    addTrackToQueue,
    openPlaylistModal,
    openDownloadRequest,
    shareTrack,
    openReportModal,
    isFavorite,
    hasDownloaded,
    toggleFavorite,
    downloadCounts,
  } = useMediaPlayer()
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false)

  const sourceType = useMemo<AudioSourceType>(() => (variant === 'remix' ? 'remix' : 'nonstop'), [variant])
  const requestPlay = (trackIndex: number) => {
    if (tracks[trackIndex]?.isPremiumDrop) {
      setPremiumPromptOpen(true)
      return
    }
    playCollection(tracks, trackIndex, sourceType)
  }

  return (
    <div
      className={
        variant === 'playlist'
          ? density === 'compact'
            ? 'audio-showcase audio-showcase-compact'
            : 'audio-showcase'
          : density === 'compact'
            ? 'audio-showcase audio-showcase-remix audio-showcase-compact'
            : 'audio-showcase audio-showcase-remix'
      }
    >
      <div className={density === 'compact' ? 'player-shell player-shell-rich player-shell-compact' : 'player-shell player-shell-rich'}>
        <div className="player-shell-header">
          <div>
            <div className="player-kicker">{title}</div>
            <h3>{subtitle}</h3>
          </div>
          <button
            type="button"
            className="mini-button player-shell-button"
            onClick={() => requestPlay(0)}
          >
            <Play size={16} />
            Phát toàn bộ
          </button>
        </div>

        <div className={density === 'compact' ? 'playlist-shell playlist-shell-rich playlist-shell-compact' : 'playlist-shell playlist-shell-rich'}>
          {tracks.map((track, index) => {
            const isActive = activeTrack?.id === track.id
            const activePlaying = isActive && isPlaying

            return (
              <div
                key={track.id}
                className={
                  isActive
                    ? density === 'compact'
                      ? 'playlist-row playlist-row-active playlist-row-compact'
                      : 'playlist-row playlist-row-active'
                    : density === 'compact'
                      ? 'playlist-row playlist-row-compact'
                      : 'playlist-row'
                }
              >
                <button
                  type="button"
                  className={density === 'compact' ? 'playlist-item playlist-item-rich playlist-item-compact' : 'playlist-item playlist-item-rich'}
                  onClick={() => requestPlay(index)}
                >
                  <div className="playlist-cover-wrap" aria-hidden="true">
                    {track.cover ? (
                      <img src={track.cover} alt={track.title} className="playlist-cover" />
                    ) : (
                      <div className="playlist-cover playlist-cover-placeholder">
                        <Play size={18} />
                      </div>
                    )}
                    <span className={activePlaying ? 'playlist-cover-play playlist-cover-play-active' : 'playlist-cover-play'}>
                      <Play size={14} />
                    </span>
                  </div>
                  <div className={density === 'compact' ? 'playlist-meta playlist-meta-compact' : 'playlist-meta'}>
                    <strong>{track.title}</strong>
                    {track.isPremiumDrop ? <small className="premium-drop-badge">Premium Drop</small> : null}
                    <span className="muted">{track.artist}</span>
                  </div>
                  <span className="muted">{isActive ? (activePlaying ? 'Đang phát' : 'Đã chọn') : track.duration}</span>
                </button>

                <div className={density === 'compact' ? 'track-actions track-actions-compact' : 'track-actions'}>
                  <button type="button" className="mini-button" onClick={() => addTrackToQueue(track, sourceType)}>
                    <ListPlus size={16} />
                    Queue
                  </button>
                  <button type="button" className="mini-button" onClick={() => openPlaylistModal(track, sourceType)}>
                    <Plus size={16} />
                    Playlist
                  </button>
                  <button
                    type="button"
                    className="mini-button mini-button-icon"
                    onClick={() => void shareTrack(track, sourceType)}
                    aria-label="Chia sẻ track"
                    title="Chia sẻ track"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    type="button"
                    className={isFavorite(track.id) ? 'mini-button mini-button-icon mini-button-liked' : 'mini-button mini-button-icon'}
                    onClick={() => toggleFavorite(track)}
                    aria-label="Yêu thích track"
                    title="Yêu thích track"
                  >
                    <Heart size={16} fill={isFavorite(track.id) ? 'currentColor' : 'none'} />
                  </button>
                  {variant === 'remix' ? (
                    <>
                      <div className="track-stat">
                        <strong>{(downloadCounts[track.id] ?? track.downloads ?? 0).toLocaleString('en-US')}</strong>
                        <span className="muted">downloads</span>
                      </div>
                      <button
                        type="button"
                        className={hasDownloaded(track.id) ? 'mini-button mini-button-icon mini-button-liked' : 'mini-button mini-button-icon'}
                        onClick={() => openDownloadRequest(track)}
                        aria-label="Download track"
                        title="Download track"
                      >
                        <Download size={16} />
                      </button>
                    </>
                  ) : track.likes ? (
                    <div className="track-stat">
                      <strong>{track.likes}</strong>
                      <span className="muted">likes</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="mini-button mini-button-icon"
                    onClick={() => openReportModal(track, sourceType)}
                    aria-label="Báo cáo track"
                    title="Báo cáo track"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {premiumPromptOpen ? (
        <div className="premium-drop-modal" role="dialog" aria-modal="true" aria-labelledby="premium-drop-title">
          <div className="premium-drop-modal-card">
            <span className="section-eyebrow">Premium Drop</span>
            <h3 id="premium-drop-title">Nội dung này cần quyền Premium Drop</h3>
            <p>Mở quyền 24 giờ với 10 sao trong Dashboard, hoặc dùng VIP Community để truy cập trọn tháng.</p>
            <div className="premium-drop-modal-actions">
              <button type="button" className="button-secondary" onClick={() => setPremiumPromptOpen(false)}>Để sau</button>
              <Link href="/tai-khoan/dashboard#premium-drop" className="button" onClick={() => setPremiumPromptOpen(false)}>Mở tại Dashboard</Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
