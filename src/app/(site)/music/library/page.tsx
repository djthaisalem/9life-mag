'use client'

import Link from 'next/link'
import { Check, Clock3, Download, ImagePlus, LibraryBig, Link2, ListMusic, Play, Plus, Search, Share2, Sparkles, Trash2 } from 'lucide-react'
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { useMediaPlayer } from '@/components/global-media-player'
import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'
import { copyText } from '@/lib/client-share'
import { getDownloadHistory, getListeningHistory, type MusicHistoryItem } from '@/lib/music-history'
import { catalogItemToAudioTrack, fetchPublicMusicCatalog } from '@/lib/public-music-catalog'
import {
  addTrackToPlaylist,
  buildPlaylistSharePath,
  createUserPlaylist,
  deleteUserPlaylist,
  getUserPlaylists,
  publishUserPlaylist,
  removeTrackFromPlaylist,
  updateUserPlaylist,
  type UserPlaylist,
} from '@/lib/user-playlists'

type LibraryTab = 'playlists' | 'listening' | 'downloads'
type CatalogFilter = 'all' | 'nonstop' | 'remix'
type CatalogTrack = AudioTrack & { sourceType: AudioSourceType }

const tabs: Array<{ id: LibraryTab; label: string; icon: typeof ListMusic }> = [
  { id: 'playlists', label: 'Playlist của bạn', icon: ListMusic },
  { id: 'listening', label: 'Đã nghe gần đây', icon: Clock3 },
  { id: 'downloads', label: 'Đã tải xuống', icon: Download }
]

const catalogPageSize = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}

function sourceLabel(sourceType: AudioSourceType) {
  if (sourceType === 'remix') return 'Remix'
  if (sourceType === 'nonstop') return 'Nonstop'
  return 'Track'
}

function getSourceType(track: AudioTrack | CatalogTrack): AudioSourceType {
  return 'sourceType' in track ? track.sourceType : track.id.includes('remix') ? 'remix' : 'nonstop'
}

function getPlaylistCover(playlist: UserPlaylist) {
  return playlist.cover ?? playlist.items[0]?.cover ?? '/images/default-music-cover.png'
}

async function cropPlaylistCover(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh bìa tối đa 10MB.')

  const imageUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image()
      nextImage.onload = () => resolve(nextImage)
      nextImage.onerror = () => reject(new Error('Không thể đọc ảnh này.'))
      nextImage.src = imageUrl
    })
    const size = Math.min(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 720
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể xử lý ảnh bìa.')
    context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 720, 720)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

function HistoryRow({ item, position, onPlay }: { item: MusicHistoryItem; position: number; onPlay: () => void }) {
  return (
    <article className="music-library-track-row">
      <span className="music-library-track-number">{String(position + 1).padStart(2, '0')}</span>
      <img src={item.cover ?? '/music-legacy/bg/14.jpg'} alt="" />
      <div className="music-library-track-copy"><strong>{item.title}</strong><span>{item.artist}</span></div>
      <span className="music-library-source">{sourceLabel(item.sourceType)}</span>
      <time dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time>
      <button type="button" className="music-library-play" onClick={onPlay} aria-label={`Phát ${item.title}`}><Play size={15} fill="currentColor" /></button>
    </article>
  )
}

export default function MusicLibraryPage() {
  const { playCollection } = useMediaPlayer()
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists')
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [listeningHistory, setListeningHistory] = useState<MusicHistoryItem[]>([])
  const [downloadHistory, setDownloadHistory] = useState<MusicHistoryItem[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [createFeedback, setCreateFeedback] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [feedback, setFeedback] = useState('')
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(catalogPageSize)
  const [catalogTracks, setCatalogTracks] = useState<CatalogTrack[]>([])
  const playlistNameInputRef = useRef<HTMLInputElement>(null)

  const selectedPlaylist = useMemo(() => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null, [playlists, selectedPlaylistId])
  const filteredCatalogTracks = useMemo(() => {
    const query = catalogQuery.trim().toLocaleLowerCase('vi-VN')
    return catalogTracks.filter((track) => {
      const matchesFilter = catalogFilter === 'all' || track.sourceType === catalogFilter
      return matchesFilter && (!query || track.title.toLocaleLowerCase('vi-VN').includes(query))
    })
  }, [catalogFilter, catalogQuery])
  const visibleCatalogTracks = filteredCatalogTracks.slice(0, catalogVisibleCount)

  const refreshPlaylists = (nextSelectedId?: string) => {
    const next = getUserPlaylists()
    setPlaylists(next)
    setSelectedPlaylistId(nextSelectedId ?? selectedPlaylistId ?? next[0]?.id ?? '')
  }

  useEffect(() => {
    const next = getUserPlaylists()
    setPlaylists(next)
    setSelectedPlaylistId(next[0]?.id ?? '')
    setListeningHistory(getListeningHistory())
    setDownloadHistory(getDownloadHistory())
    void fetchPublicMusicCatalog().then((tracks) => {
      setCatalogTracks(tracks.map((track) => ({
        ...catalogItemToAudioTrack(track),
        sourceType: track.type,
      })))
    }).catch(() => setCatalogTracks([]))
  }, [])

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setCoverPreview(await cropPlaylistCover(file))
      setFeedback('Ảnh bìa đã được crop vuông, sẵn sàng để tạo playlist.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể xử lý ảnh bìa.')
    }
  }

  const handleCreatePlaylist = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setCreateFeedback('')

    if (!newPlaylistName.trim()) {
      setCreateFeedback('Vui lòng nhập tên playlist trước khi tạo.')
      playlistNameInputRef.current?.focus()
      return
    }

    try {
      const created = createUserPlaylist(newPlaylistName, coverPreview || undefined)
      if (!created) return
      setNewPlaylistName('')
      setCoverPreview('')
      setCreateFeedback(`Đã tạo playlist “${created.name}”.`)
      setFeedback('')
      refreshPlaylists(created.id)
    } catch {
      setCreateFeedback('Trình duyệt không thể lưu playlist. Hãy xóa bớt ảnh bìa cũ hoặc kiểm tra quyền lưu dữ liệu của trình duyệt.')
    }
  }

  const handleAddTrack = (track: AudioTrack) => {
    if (!selectedPlaylist) return
    addTrackToPlaylist(selectedPlaylist.id, track, getSourceType(track))
    setFeedback(`Đã thêm “${track.title}” vào ${selectedPlaylist.name}.`)
    refreshPlaylists(selectedPlaylist.id)
  }

  const handleRemoveTrack = (track: AudioTrack) => {
    if (!selectedPlaylist) return
    removeTrackFromPlaylist(selectedPlaylist.id, track.id)
    setFeedback(`Đã xoá “${track.title}” khỏi playlist.`)
    refreshPlaylists(selectedPlaylist.id)
  }

  const handleCopyShare = async () => {
    if (!selectedPlaylist || typeof window === 'undefined') return
    setFeedback('Đang đồng bộ playlist để chia sẻ...')
    const published = await publishUserPlaylist(selectedPlaylist)
    if (!published.ok) {
      setFeedback(published.message)
      return
    }
    const shareUrl = `${window.location.origin}${buildPlaylistSharePath(selectedPlaylist.shareCode)}`
    const copied = await copyText(shareUrl)
    setFeedback(copied
      ? 'Đã sao chép URL chia sẻ thân thiện cho playlist này.'
      : `Không thể tự sao chép. Link playlist: ${shareUrl}`)
  }

  const handleOpenSharePage = async () => {
    if (!selectedPlaylist || typeof window === 'undefined') return
    setFeedback('Đang đồng bộ playlist để mở trang chia sẻ...')
    const published = await publishUserPlaylist(selectedPlaylist)
    if (!published.ok) {
      setFeedback(published.message)
      return
    }
    window.open(buildPlaylistSharePath(selectedPlaylist.shareCode), '_blank', 'noopener,noreferrer')
    setFeedback('Playlist đã được xuất bản. Bạn có thể chia sẻ link này trên mọi thiết bị.')
  }

  const playTrack = (track: AudioTrack, sourceType: AudioSourceType) => playCollection([track], 0, sourceType)

  return (
    <main className="music-library-page">
      <section className="music-library-hero">
        <div className="music-library-hero-inner">
          <div>
            <p className="eyebrow"><LibraryBig size={14} /> 9Life Music</p>
            <h1>Thư viện <span>của bạn</span></h1>
            <p>Không gian riêng để tạo playlist, thêm nhạc từ mọi điểm phát và chia sẻ bộ sưu tập của bạn bằng một đường dẫn rõ ràng.</p>
            <div className="music-library-hero-actions"><Link href="/music" className="button-secondary">Khám phá Music</Link><Link href="/tai-khoan/dashboard" className="music-library-dashboard-link">Dashboard User</Link></div>
          </div>
          <div className="music-library-stat-grid" aria-label="Thống kê thư viện">
            <div><ListMusic size={17} /><strong>{playlists.length}</strong><span>playlist</span></div>
            <div><Clock3 size={17} /><strong>{listeningHistory.length}</strong><span>đã nghe</span></div>
            <div><Download size={17} /><strong>{downloadHistory.length}</strong><span>đã tải</span></div>
          </div>
        </div>
      </section>

      <section className="music-library-workspace">
        <div className="music-library-heading"><div><p className="eyebrow"><Sparkles size={14} /> Không gian cá nhân</p><h2>Âm nhạc của bạn</h2></div><Link href="/music" className="music-library-back">Quay lại Music</Link></div>
        <div className="music-library-tabs" role="tablist" aria-label="Danh mục thư viện">
          {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}><Icon size={16} />{tab.label}</button> })}
        </div>

        {activeTab === 'playlists' ? (
          <div className="music-library-manager" id="playlist-manager">
            <div className="music-library-manager-head"><div><p className="eyebrow">Playlist studio</p><h3>Tạo và quản lý playlist</h3></div><span>+ Playlist</span></div>
            <div className="music-library-create-grid">
              <label className="music-library-cover-upload">{coverPreview ? <img src={coverPreview} alt="Xem trước ảnh bìa playlist" /> : <><ImagePlus size={22} /><span>Ảnh bìa</span><small>Tự crop vuông</small></>}<input type="file" accept="image/*" onChange={(event) => void handleCoverChange(event)} /></label>
              <form className="music-library-create-fields" onSubmit={handleCreatePlaylist}>
                <label>
                  Tên playlist
                  <input
                    ref={playlistNameInputRef}
                    value={newPlaylistName}
                    onChange={(event) => {
                      setNewPlaylistName(event.target.value)
                      if (createFeedback) setCreateFeedback('')
                    }}
                    placeholder="Ví dụ: Friday Rooftop"
                  />
                </label>
                <button type="submit" className="button"><Plus size={16} /> Tạo playlist</button>
                {createFeedback ? <p className="music-library-feedback" aria-live="polite"><Check size={15} /> {createFeedback}</p> : null}
              </form>
            </div>

            {playlists.length > 0 ? <div className="music-library-playlist-list">{playlists.map((playlist) => <article key={playlist.id} className={selectedPlaylist?.id === playlist.id ? 'music-library-playlist-row is-selected' : 'music-library-playlist-row'}><button type="button" className="music-library-playlist-select" onClick={() => setSelectedPlaylistId(playlist.id)}><img src={getPlaylistCover(playlist)} alt="" /><span><strong>{playlist.name}</strong><small>{playlist.items.length} bản nhạc · {playlist.favorites ?? 0} yêu thích</small></span></button><span className="music-library-playlist-listens">{playlist.listens.toLocaleString('vi-VN')} lượt nghe</span><button type="button" className="music-library-play" disabled={playlist.items.length === 0} onClick={() => playCollection(playlist.items, 0, playlist.items[0]?.sourceType ?? 'track')} aria-label={`Phát playlist ${playlist.name}`}><Play size={15} fill="currentColor" /></button></article>)}</div> : <EmptyLibrary message="Tạo playlist đầu tiên để bắt đầu lưu các track và nonstop bạn yêu thích." />}

            {selectedPlaylist ? <section className="music-library-editor">
              <div className="music-library-editor-head"><div><p className="eyebrow">Đang chỉnh sửa</p><h3>{selectedPlaylist.name}</h3></div><button type="button" className="music-library-delete" onClick={() => { deleteUserPlaylist(selectedPlaylist.id); setFeedback(`Đã xoá playlist “${selectedPlaylist.name}”.`); refreshPlaylists('') }}><Trash2 size={15} /> Xoá playlist</button></div>
              <div className="music-library-share-box"><div><Link2 size={16} /><span>{buildPlaylistSharePath(selectedPlaylist.shareCode)}</span></div><button type="button" onClick={() => void handleCopyShare()}><Share2 size={15} /> Xuất bản & sao chép</button><button type="button" onClick={() => void handleOpenSharePage()}>Mở trang</button></div>
              <div className="music-library-editor-grid"><div><h4>Nhạc trong playlist</h4><div className="music-library-track-list">{selectedPlaylist.items.length ? selectedPlaylist.items.map((track, index) => <article key={track.id} className="music-library-track-row"><span className="music-library-track-number">{String(index + 1).padStart(2, '0')}</span><img src={track.cover ?? '/music-legacy/bg/14.jpg'} alt="" /><div className="music-library-track-copy"><strong>{track.title}</strong><span>{track.artist}</span></div><button type="button" className="music-library-remove-track" onClick={() => handleRemoveTrack(track)}><Trash2 size={14} /> Xoá</button></article>) : <p className="music-library-empty-copy">Playlist chưa có nhạc. Chọn từ catalog bên cạnh hoặc dùng nút + Playlist tại bất kỳ track nào trên site.</p>}</div></div><div><h4>Thêm từ Music catalog</h4><div className="music-library-catalog-controls"><div className="music-library-catalog-tabs" role="tablist" aria-label="Lọc Music catalog">{(['all', 'nonstop', 'remix'] as const).map((filter) => <button key={filter} type="button" className={catalogFilter === filter ? 'is-active' : ''} onClick={() => { setCatalogFilter(filter); setCatalogVisibleCount(catalogPageSize) }}>{filter === 'all' ? 'Tất cả' : filter === 'nonstop' ? 'Nonstop' : 'Remix'}</button>)}</div><label className="music-library-catalog-search"><Search size={15} /><input value={catalogQuery} onChange={(event) => { setCatalogQuery(event.target.value); setCatalogVisibleCount(catalogPageSize) }} placeholder="Tìm theo tên bài nhạc" /></label></div><div className="music-library-catalog-list">{visibleCatalogTracks.map((track) => <article key={track.id}><img src={track.cover ?? '/music-legacy/bg/14.jpg'} alt="" /><div><strong>{track.title}</strong><span>{track.artist}</span></div><button type="button" onClick={() => handleAddTrack(track)} aria-label={`Thêm ${track.title}`}><Plus size={15} /></button></article>)}</div>{visibleCatalogTracks.length === 0 ? <p className="music-library-catalog-empty">Không tìm thấy bài nhạc phù hợp.</p> : null}{visibleCatalogTracks.length < filteredCatalogTracks.length ? <button type="button" className="music-library-catalog-more" onClick={() => setCatalogVisibleCount((count) => count + catalogPageSize)}>Xem thêm</button> : null}</div></div>
            </section> : null}
            {feedback ? <p className="music-library-feedback"><Check size={15} /> {feedback}</p> : null}
          </div>
        ) : <div className="music-library-panel">{activeTab === 'listening' && (listeningHistory.length ? <div className="music-library-track-list">{listeningHistory.map((item, index) => <HistoryRow key={`${item.id}-${item.occurredAt}`} item={item} position={index} onPlay={() => playTrack(item, item.sourceType)} />)}</div> : <EmptyLibrary message="Các bản nhạc bạn phát sẽ tự động xuất hiện ở đây." />)}{activeTab === 'downloads' && (downloadHistory.length ? <div className="music-library-track-list">{downloadHistory.map((item, index) => <HistoryRow key={`${item.id}-${item.occurredAt}`} item={item} position={index} onPlay={() => playTrack(item, item.sourceType)} />)}</div> : <EmptyLibrary message="Lịch sử tải nhạc sẽ được lưu sau lượt tải đầu tiên." />)}</div>}
      </section>
    </main>
  )
}

function EmptyLibrary({ message }: { message: string }) {
  return <div className="music-library-empty"><LibraryBig size={24} /><strong>Thư viện đang chờ bạn</strong><p>{message}</p><Link href="/music" className="button-primary">Khám phá âm nhạc</Link></div>
}
