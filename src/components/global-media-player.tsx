'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  Download,
  Heart,
  ListMusic,
  Pause,
  Play,
  Plus,
  Repeat2,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { accessTrackWithStars, fetchUserAccessState, loginDemoUser } from '@/lib/client-user-access'
import { createReferralShareUrl } from '@/lib/client-referrals'
import { copyText } from '@/lib/client-share'
import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'
import {
  addTrackToPlaylist,
  createUserPlaylist,
  getUserPlaylists,
  type UserPlaylist,
} from '@/lib/user-playlists'
import { recordDownload, recordListening } from '@/lib/music-history'

const FAVORITE_TRACKS_STORAGE_KEY = 'nine-life-favorite-tracks'
const PLAYER_RESUME_STORAGE_KEY = 'nine-life-media-player-resume'

type PendingPlaybackAction =
  | { type: 'toggle' }
  | { type: 'track'; index: number; track?: AudioTrack }
  | { type: 'step'; direction: -1 | 1 }

type PlayerResumeState = {
  queue: AudioTrack[]
  activeIndex: number
  activeSourceType: AudioSourceType
  progress: number
  savedAt: number
}

type MediaPlayerContextValue = {
  activeTrack: AudioTrack | null
  activeSourceType: AudioSourceType
  activeIndex: number
  isPlaying: boolean
  queue: AudioTrack[]
  playCollection: (tracks: readonly AudioTrack[], startIndex: number, sourceType: AudioSourceType) => void
  addTrackToQueue: (track: AudioTrack, sourceType: AudioSourceType) => void
  openPlaylistModal: (track: AudioTrack, sourceType: AudioSourceType) => void
  openDownloadRequest: (track: AudioTrack) => void
  shareTrack: (track: AudioTrack, sourceType: AudioSourceType) => void
  openReportModal: (track: AudioTrack, sourceType: AudioSourceType) => void
  isFavorite: (trackId: string) => boolean
  hasDownloaded: (trackId: string) => boolean
  toggleFavorite: (track: AudioTrack) => void
  downloadCounts: Record<string, number>
  favoriteTrackIds: string[]
}

const MediaPlayerContext = createContext<MediaPlayerContextValue | null>(null)

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function readFavoriteTrackIds() {
  if (typeof window === 'undefined') return [] as string[]

  try {
    return JSON.parse(window.localStorage.getItem(FAVORITE_TRACKS_STORAGE_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function saveFavoriteTrackIds(trackIds: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FAVORITE_TRACKS_STORAGE_KEY, JSON.stringify(trackIds))
}

function readPlayerResumeState() {
  if (typeof window === 'undefined') return null

  try {
    const value = JSON.parse(window.localStorage.getItem(PLAYER_RESUME_STORAGE_KEY) ?? 'null') as PlayerResumeState | null
    if (!value || !Array.isArray(value.queue) || !Number.isFinite(value.progress) || Date.now() - value.savedAt > 30 * 24 * 60 * 60 * 1000) return null
    return value
  } catch {
    return null
  }
}

function savePlayerResumeState(value: PlayerResumeState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PLAYER_RESUME_STORAGE_KEY, JSON.stringify(value))
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext)

  if (!context) {
    throw new Error('useMediaPlayer must be used within MediaPlayerProvider')
  }

  return context
}

export function MediaPlayerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queue, setQueue] = useState<AudioTrack[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeSourceType, setActiveSourceType] = useState<AudioSourceType>('track')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.72)
  const [isMuted, setIsMuted] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(10)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingPlaybackAction, setPendingPlaybackAction] = useState<PendingPlaybackAction | null>(null)
  const [pendingDownloadTrack, setPendingDownloadTrack] = useState<AudioTrack | null>(null)
  const [pendingPlaylistTrack, setPendingPlaylistTrack] = useState<AudioTrack | null>(null)
  const [pendingPlaylistSourceType, setPendingPlaylistSourceType] = useState<AudioSourceType>('track')
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [playlistFeedback, setPlaylistFeedback] = useState('')
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({})
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<string[]>([])
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([])
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeatOn, setIsRepeatOn] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [pendingReportTrack, setPendingReportTrack] = useState<AudioTrack | null>(null)
  const [pendingReportSourceType, setPendingReportSourceType] = useState<AudioSourceType>('track')
  const [issueReporterName, setIssueReporterName] = useState('')
  const [issueReporterEmail, setIssueReporterEmail] = useState('')
  const [issueDetails, setIssueDetails] = useState('')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const resumePositionRef = useRef<{ trackId: string; progress: number } | null>(null)
  const lastPersistedProgressRef = useRef(0)
  const activeTrack = queue[activeIndex] ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return

    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setStarBalance(snapshot.state.stars)
      setUserPlaylists(getUserPlaylists())
      setFavoriteTrackIds(readFavoriteTrackIds())

      const resumeState = readPlayerResumeState()
      if (resumeState?.queue.length) {
        setQueue(resumeState.queue)
        setActiveIndex(Math.min(Math.max(resumeState.activeIndex, 0), resumeState.queue.length - 1))
        setActiveSourceType(resumeState.activeSourceType)
        setProgress(resumeState.progress)
        resumePositionRef.current = {
          trackId: resumeState.queue[Math.min(Math.max(resumeState.activeIndex, 0), resumeState.queue.length - 1)]?.id ?? '',
          progress: resumeState.progress,
        }
      }
    })()
  }, [])

  useEffect(() => {
    if (!activeTrack || progress - lastPersistedProgressRef.current < 4) return

    savePlayerResumeState({
      queue,
      activeIndex,
      activeSourceType,
      progress,
      savedAt: Date.now(),
    })
    lastPersistedProgressRef.current = progress
  }, [activeIndex, activeSourceType, activeTrack, progress, queue])

  useEffect(() => {
    if (!activeTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title,
      artist: activeTrack.artist,
      artwork: activeTrack.cover ? [{ src: activeTrack.cover }] : [],
    })
  }, [activeTrack])

  useEffect(() => {
    if (isPlaying && activeTrack) recordListening(activeTrack, activeSourceType)
  }, [activeSourceType, activeTrack, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncTime = () => setProgress(audio.currentTime)
    const syncDuration = () => {
      setDuration(audio.duration || 0)
      const resumePosition = resumePositionRef.current
      if (resumePosition?.trackId === activeTrack?.id && resumePosition.progress > 0) {
        audio.currentTime = Math.min(resumePosition.progress, Math.max((audio.duration || resumePosition.progress) - 1, 0))
        setProgress(audio.currentTime)
        resumePositionRef.current = null
      }
    }
    const onEnded = () => {
      if (isRepeatOn && activeTrack) {
        audio.currentTime = 0
        void audio.play()
        setProgress(0)
        return
      }

      if (queue.length > 1) {
        const nextIndex = (activeIndex + 1) % queue.length
        setActiveIndex(nextIndex)
        setIsPlaying(true)
        return
      }

      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('loadedmetadata', syncDuration)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('loadedmetadata', syncDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [activeIndex, activeTrack, isRepeatOn, queue.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack) return

    audio.pause()
    audio.load()
    setProgress(0)
    setDuration(0)
  }, [activeIndex, activeTrack?.audioUrl, activeTrack?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack?.audioUrl) return

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false))
      return
    }

    audio.pause()
  }, [activeTrack?.audioUrl, activeTrack?.id, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
    audio.muted = isMuted
  }, [isMuted, volume])

  useEffect(() => {
    if (!activeTrack || isPlaying) return

    savePlayerResumeState({
      queue,
      activeIndex,
      activeSourceType,
      progress,
      savedAt: Date.now(),
    })
    lastPersistedProgressRef.current = progress
  }, [activeIndex, activeSourceType, activeTrack, isPlaying, progress, queue])

  const progressPercent = useMemo(() => {
    if (!duration) return 0
    return Math.min((progress / duration) * 100, 100)
  }, [duration, progress])

  const isFavorite = (trackId: string) => favoriteTrackIds.includes(trackId)
  const hasDownloaded = (trackId: string) => downloadedTrackIds.includes(trackId)

  const toggleFavorite = (track: AudioTrack) => {
    setFavoriteTrackIds((current) => {
      const next = current.includes(track.id)
        ? current.filter((item) => item !== track.id)
        : [track.id, ...current]

      saveFavoriteTrackIds(next)
      return next
    })
  }

  const requestProtectedMedia = async (track: AudioTrack, kind: 'preview' | 'download') => {
    const response = await fetch(`/api/media/${encodeURIComponent(track.id)}`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    })
    const result = await response.json() as { ok?: boolean; url?: string; message?: string }
    return { ok: response.ok && result.ok === true && Boolean(result.url), url: result.url, message: result.message, status: response.status }
  }

  const playNow = async (action: PendingPlaybackAction) => {
    let targetTrack =
      action.type === 'toggle'
        ? activeTrack
        : action.type === 'track'
          ? action.track ?? queue[action.index]
          : queue[(activeIndex + action.direction + queue.length) % queue.length]

    if (!targetTrack) return

    if (targetTrack.protectedMedia && !targetTrack.audioUrl) {
      const protectedResult = await requestProtectedMedia(targetTrack, 'preview')
      if (!protectedResult.ok || !protectedResult.url) {
        if (protectedResult.status === 401) {
          setPendingPlaybackAction(action)
          setShowLoginModal(true)
          return
        }
        window.alert(protectedResult.message ?? 'Không thể cấp quyền phát track này.')
        return
      }
      targetTrack = { ...targetTrack, audioUrl: protectedResult.url }
      setQueue((current) => current.map((track) => track.id === targetTrack.id ? targetTrack : track))
    } else {
      const result = await accessTrackWithStars(targetTrack.id, 'playback')

      if (!result.ok) {
        if (result.reason === 'not_authenticated') {
          setPendingPlaybackAction(action)
          setShowLoginModal(true)
          return
        }

        if (result.reason !== 'insufficient_stars') {
          window.alert(result.message ?? 'Không thể xác thực quyền phát nhạc lúc này. Vui lòng thử lại sau.')
          return
        }

        window.alert('Bạn không đủ sao để phát nhạc. Hãy nạp thêm sao trong tài khoản.')
        return
      }

      setStarBalance(result.state.stars)
    }

    if (action.type === 'toggle') {
      const audio = audioRef.current
      if (!audio || !activeTrack) return

      await audio.play()
      setIsPlaying(true)
      return
    }

    if (action.type === 'track') {
      setActiveIndex(action.index)
      setIsPlaying(true)
      return
    }

    const nextIndex = (activeIndex + action.direction + queue.length) % queue.length
    setActiveIndex(nextIndex)
    setIsPlaying(true)
  }

  const playCollection = (tracks: readonly AudioTrack[], startIndex: number, sourceType: AudioSourceType) => {
    const normalizedTracks = isShuffled ? [...tracks].sort(() => Math.random() - 0.5) : [...tracks]
    const targetTrack = tracks[startIndex]
    const normalizedIndex = Math.max(
      0,
      normalizedTracks.findIndex((track) => track.id === targetTrack.id)
    )

    setQueue(normalizedTracks)
    setActiveIndex(normalizedIndex)
    setActiveSourceType(sourceType)
    setIsDismissed(false)
    setIsPlaying(false)
    window.setTimeout(() => {
      void playNow({ type: 'track', index: normalizedIndex, track: targetTrack })
    }, 0)
  }

  const addTrackToQueue = (track: AudioTrack, sourceType: AudioSourceType) => {
    setIsDismissed(false)
    setQueue((current) => {
      const exists = current.some((item) => item.id === track.id)
      const next = exists ? current : [...current, track]
      if (!activeTrack) {
        setActiveIndex(0)
        setActiveSourceType(sourceType)
      }
      return next
    })
  }

  const stepTrack = (direction: -1 | 1) => {
    if (!queue.length) return
    void playNow({ type: 'step', direction })
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !activeTrack) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    await playNow({ type: 'toggle' })
  }

  const seekTo = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setProgress(value)
    if (activeTrack) {
      savePlayerResumeState({
        queue,
        activeIndex,
        activeSourceType,
        progress: value,
        savedAt: Date.now(),
      })
      lastPersistedProgressRef.current = value
    }
  }

  const registerDownload = (track: AudioTrack) => {
    setDownloadCounts((current) => ({
      ...current,
      [track.id]: (current[track.id] ?? track.downloads ?? 0) + 1,
    }))
    setDownloadedTrackIds((current) => (current.includes(track.id) ? current : [...current, track.id]))
    recordDownload(track, activeSourceType)
  }

  const openDownload = (track: AudioTrack) => {
    registerDownload(track)
    const downloadUrl = track.downloadUrl ?? track.audioUrl
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = ''
    anchor.rel = 'noopener noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  const openDownloadRequest = async (track: AudioTrack) => {
    if (track.protectedMedia) {
      const result = await requestProtectedMedia(track, 'download')
      if (!result.ok || !result.url) {
        window.alert(result.message ?? 'Không thể cấp quyền download lúc này.')
        return
      }
      openDownload({ ...track, downloadUrl: result.url })
      return
    }

    if (isAuthenticated) {
      const result = await accessTrackWithStars(track.id, 'download')
      if (!result.ok) {
        if (result.reason !== 'insufficient_stars') {
          window.alert(
            result.reason === 'not_authenticated'
              ? 'Vui lòng đăng nhập để tải nhạc.'
              : result.message ?? 'Không thể xác thực quyền download lúc này. Vui lòng thử lại sau.',
          )
          return
        }

        window.alert('Bạn không đủ sao để download. Hãy nạp thêm sao trong tài khoản.')
        return
      }
      setStarBalance(result.state.stars)
      openDownload(track)
      return
    }

    setPendingDownloadTrack(track)
    setShowLoginModal(true)
  }

  const buildCopyrightReportHref = (track: AudioTrack, sourceType: AudioSourceType) => {
    const params = new URLSearchParams({
      track: track.title,
      artist: track.artist,
      trackId: track.id,
      source: sourceType,
    })

    return `/bao-cao-ban-quyen?${params.toString()}`
  }

  const shareTrack = async (track: AudioTrack, sourceType: AudioSourceType) => {
    const sharePath = `/music/track/${encodeURIComponent(track.id)}`
    const fallbackUrl = typeof window === 'undefined' ? sharePath : `${window.location.origin}${sharePath}`
    const referral = await createReferralShareUrl(sharePath)
    const shareUrl = referral.url ?? fallbackUrl

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `${track.title} - ${track.artist}`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    const copied = await copyText(shareUrl)
    if (!copied) window.prompt('Copy link chia sẻ track', shareUrl)
    window.alert(referral.ok ? 'Đã copy link chia sẻ. Sao sẽ được cộng khi có lượt truy cập hợp lệ.' : 'Đã copy link chia sẻ track.')
  }

  const openReportModal = (track: AudioTrack, sourceType: AudioSourceType) => {
    setPendingReportTrack(track)
    setPendingReportSourceType(sourceType)
    setShowReportModal(true)
  }

  const closeReportModal = () => {
    setShowReportModal(false)
    setPendingReportTrack(null)
  }

  const openIssueForm = () => {
    setShowReportModal(false)
    setShowIssueModal(true)
  }

  const closeIssueForm = () => {
    setShowIssueModal(false)
    setIssueReporterName('')
    setIssueReporterEmail('')
    setIssueDetails('')
  }

  const submitIssueReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    window.alert('Đã ghi nhận báo cáo hư nhạc. Team sẽ kiểm tra track này sớm nhất có thể.')
    closeIssueForm()
  }

  const openPlaylistModal = (track: AudioTrack, sourceType: AudioSourceType) => {
    setPendingPlaylistTrack(track)
    setPendingPlaylistSourceType(sourceType)
    setShowPlaylistModal(true)
    setPlaylistFeedback('')
    setUserPlaylists(getUserPlaylists())
  }

  const closePlaylistModal = () => {
    setShowPlaylistModal(false)
    setPendingPlaylistTrack(null)
    setNewPlaylistName('')
    setPlaylistFeedback('')
  }

  const saveTrackToPlaylist = (playlistId: string) => {
    if (!pendingPlaylistTrack) return

    const next = addTrackToPlaylist(playlistId, pendingPlaylistTrack, pendingPlaylistSourceType)
    const playlist = next.find((item) => item.id === playlistId)
    setUserPlaylists(next)
    setPlaylistFeedback(playlist ? `Đã thêm vào playlist ${playlist.name}.` : 'Đã thêm track vào playlist.')
  }

  const createPlaylistAndSaveTrack = () => {
    const created = createUserPlaylist(newPlaylistName)
    if (!created || !pendingPlaylistTrack) return

    setUserPlaylists(getUserPlaylists())
    setNewPlaylistName('')
    saveTrackToPlaylist(created.id)
  }

  const closeLoginModal = () => {
    setShowLoginModal(false)
    setPendingDownloadTrack(null)
    setPendingPlaybackAction(null)
  }

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!loginEmail || !loginPassword) return

    const result = await loginDemoUser(loginEmail, loginPassword)
    if (!result.ok) {
      window.alert(result.message ?? 'Đăng nhập chưa thành công.')
      return
    }

    const snapshot = await fetchUserAccessState()
    setIsAuthenticated(snapshot.state.isAuthenticated)
    setStarBalance(snapshot.state.stars)
    setShowLoginModal(false)
    setLoginPassword('')

    if (pendingDownloadTrack) {
      openDownload(pendingDownloadTrack)
      setPendingDownloadTrack(null)
    }

    if (pendingPlaybackAction) {
      const queuedAction = pendingPlaybackAction
      setPendingPlaybackAction(null)
      void playNow(queuedAction)
    }
  }

  const removeFromQueue = (trackId: string) => {
    setQueue((current) => {
      const next = current.filter((track) => track.id !== trackId)
      const removedIndex = current.findIndex((track) => track.id === trackId)

      if (!next.length) {
        setIsPlaying(false)
        setActiveIndex(0)
        return next
      }

      if (removedIndex < activeIndex) {
        setActiveIndex((index) => Math.max(index - 1, 0))
      } else if (removedIndex === activeIndex) {
        setActiveIndex((index) => Math.min(index, next.length - 1))
      }

      return next
    })
  }

  const dismissPlayer = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PLAYER_RESUME_STORAGE_KEY)
    }

    resumePositionRef.current = null
    setIsPlaying(false)
    setIsQueueOpen(false)
    setIsDismissed(true)
    setQueue([])
    setActiveIndex(0)
    setProgress(0)
    setDuration(0)
  }

  useEffect(() => {
    if (!activeTrack || typeof window === 'undefined') return

    const persistPosition = () => {
      savePlayerResumeState({
        queue,
        activeIndex,
        activeSourceType,
        progress: audioRef.current?.currentTime ?? progress,
        savedAt: Date.now(),
      })
    }

    window.addEventListener('pagehide', persistPosition)
    window.addEventListener('beforeunload', persistPosition)
    return () => {
      window.removeEventListener('pagehide', persistPosition)
      window.removeEventListener('beforeunload', persistPosition)
    }
  }, [activeIndex, activeSourceType, activeTrack, progress, queue])

  useEffect(() => {
    if (!activeTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlaying) void togglePlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlaying) void togglePlay()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => stepTrack(-1))
    navigator.mediaSession.setActionHandler('nexttrack', () => stepTrack(1))

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [activeIndex, activeTrack, isPlaying, queue])

  const contextValue: MediaPlayerContextValue = {
    activeTrack,
    activeSourceType,
    activeIndex,
    isPlaying,
    queue,
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
    favoriteTrackIds,
  }

  return (
    <MediaPlayerContext.Provider value={contextValue}>
      {children}

      {activeTrack && !isDismissed ? (
        <div className="global-media-player-shell">
          <button type="button" className="global-media-player-dismiss" onClick={dismissPlayer} aria-label="Tắt media player">
            <X size={18} />
          </button>
          {isQueueOpen ? (
            <div className="global-media-player-queue">
              <div className="global-media-player-queue-head">
                <div>
                  <span className="player-kicker">Playback Queue</span>
                  <strong>{queue.length} mục trong hàng chờ</strong>
                </div>
                <button type="button" className="player-icon-button" onClick={() => setIsQueueOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="global-media-player-queue-list">
                {queue.map((track, index) => (
                  <div key={track.id} className={index === activeIndex ? 'global-media-player-queue-item global-media-player-queue-item-active' : 'global-media-player-queue-item'}>
                    <button
                      type="button"
                      className="global-media-player-queue-main"
                      onClick={() => void playNow({ type: 'track', index })}
                    >
                      {track.cover ? <img src={track.cover} alt={track.title} /> : <div className="global-media-player-queue-cover" />}
                      <div>
                        <strong>{track.title}</strong>
                        <span>{track.artist}</span>
                      </div>
                    </button>
                    <div className="global-media-player-queue-actions">
                      <button type="button" className="player-icon-button" onClick={() => toggleFavorite(track)}>
                        <Heart size={15} fill={isFavorite(track.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button type="button" className="player-icon-button" onClick={() => openPlaylistModal(track, activeSourceType)}>
                        <Plus size={15} />
                      </button>
                      <button type="button" className="player-icon-button" onClick={() => removeFromQueue(track.id)}>
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="global-media-player">
            <div className="global-media-player-track">
              {activeTrack.cover ? <img src={activeTrack.cover} alt={activeTrack.title} className="global-media-player-cover" /> : <div className="global-media-player-cover global-media-player-cover-placeholder" />}
              <div className="global-media-player-meta">
                <strong>{activeTrack.title}</strong>
                <span>{activeTrack.artist}</span>
                <small>
                  {isAuthenticated ? `Còn ${starBalance} sao trong ví` : 'Nhấn play sẽ yêu cầu đăng nhập và trừ 1 sao'}
                </small>
              </div>
            </div>

            <div className="global-media-player-center">
              <div className="global-media-player-controls">
                <button
                  type="button"
                  className={isShuffled ? 'player-icon-button player-icon-button-active' : 'player-icon-button'}
                  onClick={() => setIsShuffled((current) => !current)}
                >
                  <Shuffle size={16} />
                </button>
                <button type="button" className="player-icon-button" onClick={() => stepTrack(-1)}>
                  <SkipBack size={18} />
                </button>
                <button type="button" className="player-main-button" onClick={togglePlay}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button type="button" className="player-icon-button" onClick={() => stepTrack(1)}>
                  <SkipForward size={18} />
                </button>
                <button
                  type="button"
                  className={isRepeatOn ? 'player-icon-button player-icon-button-active' : 'player-icon-button'}
                  onClick={() => setIsRepeatOn((current) => !current)}
                >
                  <Repeat2 size={16} />
                </button>
              </div>

              <div className="global-media-player-progress">
                <span>{formatTime(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={progress}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  style={{ ['--progress' as string]: `${progressPercent}%` }}
                />
                <span>{duration ? formatTime(duration) : activeTrack.duration}</span>
              </div>
            </div>

            <div className="global-media-player-actions">
              <button type="button" className={isFavorite(activeTrack.id) ? 'player-icon-button player-icon-button-active' : 'player-icon-button'} onClick={() => toggleFavorite(activeTrack)}>
                <Heart size={16} fill={isFavorite(activeTrack.id) ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="player-icon-button" onClick={() => openPlaylistModal(activeTrack, activeSourceType)}>
                <Plus size={16} />
              </button>
              <button type="button" className="player-icon-button" onClick={() => void shareTrack(activeTrack, activeSourceType)}>
                <Share2 size={16} />
              </button>
              <button
                type="button"
                className={hasDownloaded(activeTrack.id) ? 'player-icon-button player-icon-button-active' : 'player-icon-button'}
                onClick={() => openDownloadRequest(activeTrack)}
              >
                <Download size={16} />
              </button>
              <button type="button" className="player-icon-button" onClick={() => openReportModal(activeTrack, activeSourceType)}>
                <AlertTriangle size={16} />
              </button>
              <button type="button" className={isQueueOpen ? 'player-icon-button player-icon-button-active' : 'player-icon-button'} onClick={() => setIsQueueOpen((current) => !current)}>
                <ListMusic size={16} />
              </button>
              <div className="global-media-player-volume">
                <button type="button" className="player-icon-button" onClick={() => setIsMuted((current) => !current)}>
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(event) => {
                    setVolume(Number(event.target.value))
                    setIsMuted(false)
                  }}
                />
              </div>
              <div className="global-media-player-badges">
                <span>{queue.length} queue</span>
                <span>{favoriteTrackIds.length} liked</span>
                <span>{(downloadCounts[activeTrack.id] ?? activeTrack.downloads ?? 0).toLocaleString('en-US')} downloads</span>
              </div>
            </div>

            <audio ref={audioRef} preload="auto" playsInline>
              <source src={activeTrack.audioUrl} />
            </audio>
          </div>
        </div>
      ) : null}

      {showPlaylistModal ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Lưu vào playlist</div>
            <h3>{pendingPlaylistTrack ? pendingPlaylistTrack.title : 'Chọn playlist muốn lưu'}</h3>
            <p className="muted">Player trung tâm có thể đẩy track vào playlist cá nhân để sau này chia sẻ link, kiếm sao hoặc tạo collection riêng.</p>

            <div className="playlist-picker-list">
              {userPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  className="playlist-picker-item"
                  onClick={() => saveTrackToPlaylist(playlist.id)}
                >
                  <strong>{playlist.name}</strong>
                  <span>{playlist.items.length} track</span>
                </button>
              ))}
            </div>

            <div className="playlist-picker-create">
              <input
                type="text"
                placeholder="Tên playlist mới"
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
              />
              <button type="button" className="button" onClick={createPlaylistAndSaveTrack}>
                Tạo và lưu track
              </button>
            </div>

            {playlistFeedback ? <p className="muted">{playlistFeedback}</p> : null}

            <div className="login-gate-actions">
              <button type="button" className="button-secondary" onClick={closePlaylistModal}>
                Đóng
              </button>
              <Link href="/tai-khoan/dashboard" className="button">
                Mở dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {showReportModal && pendingReportTrack ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Báo cáo track</div>
            <h3>{pendingReportTrack.title}</h3>
            <p className="muted">
              Chọn đúng loại báo cáo để hệ thống chuyển đến đầu mối xử lý phù hợp và giữ lịch sử làm việc rõ ràng hơn.
            </p>

            <div className="report-choice-grid">
              <button type="button" className="playlist-picker-item" onClick={openIssueForm}>
                <strong>Hư nhạc / không play được</strong>
                <span>Báo lỗi kỹ thuật, file hỏng, track load lỗi hoặc không nghe được.</span>
              </button>

              <Link
                href={buildCopyrightReportHref(pendingReportTrack, pendingReportSourceType)}
                className="playlist-picker-item"
                onClick={closeReportModal}
              >
                <strong>Báo cáo bản quyền</strong>
                <span>Mở form bản quyền riêng để cung cấp chủ thể quyền, link gốc và đề xuất xử lý.</span>
              </Link>
            </div>

            <div className="login-gate-actions">
              <button type="button" className="button-secondary" onClick={closeReportModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showIssueModal && pendingReportTrack ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Báo lỗi nhạc</div>
            <h3>{pendingReportTrack.title}</h3>
            <p className="muted">
              Cho chúng tôi biết track nào đang gặp sự cố để team kỹ thuật kiểm tra nhanh hơn.
            </p>

            <form className="login-gate-form" onSubmit={submitIssueReport}>
              <input
                type="text"
                placeholder="Họ và tên"
                value={issueReporterName}
                onChange={(event) => setIssueReporterName(event.target.value)}
              />
              <input
                type="email"
                placeholder="Email liên hệ"
                value={issueReporterEmail}
                onChange={(event) => setIssueReporterEmail(event.target.value)}
              />
              <textarea
                className="report-textarea"
                placeholder="Mô tả lỗi: không phát được, phát nhưng không có tiếng, file đứng giữa chừng, lỗi trên thiết bị nào..."
                value={issueDetails}
                onChange={(event) => setIssueDetails(event.target.value)}
              />
              <div className="login-gate-actions">
                <button type="button" className="button-secondary" onClick={closeIssueForm}>
                  Đóng
                </button>
                <button type="submit" className="button">
                  Gửi báo lỗi
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showLoginModal ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">{pendingPlaybackAction ? 'Đăng nhập để phát nhạc' : 'Đăng nhập để tải'}</div>
            <h3>
              {pendingPlaybackAction
                ? 'Media player trung tâm sẽ trừ 1 sao khi bắt đầu phát'
                : 'Chỉ thành viên đã đăng nhập mới được download file nhạc'}
            </h3>
            <p className="muted">
              {pendingPlaybackAction
                ? 'Sau khi đăng nhập, player sẽ tự phát track đã chọn và giữ queue của bạn ở dưới chân trang.'
                : 'Flow này đang theo đúng cơ chế bảo vệ nội dung hiện tại trước khi nối auth/CMS backend thật.'}
            </p>

            <form className="login-gate-form" onSubmit={handleLoginSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
              <div className="login-gate-actions">
                <button type="button" className="button-secondary" onClick={closeLoginModal}>
                  Để sau
                </button>
                <button type="submit" className="button">
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </MediaPlayerContext.Provider>
  )
}
