'use client'

import { Minus, Plus } from 'lucide-react'
import { type ChangeEvent, useMemo, useState } from 'react'
import { CmsAlbumTrackUploader } from '@/components/cms-album-track-uploader'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type ArtistOption = { id: string; name: string; slug: string }
type GenreOption = { id: string; slug: string; name: string }
type ExistingTrack = { id: string; title: string; artist: string; type: string; duration: string; musicCode?: string }
type UploadedTrack = { trackId: string; slug: string; musicCode: string }

async function cropCover(file: File) {
  const source = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const element = new Image(); element.onload = () => resolve(element); element.onerror = () => reject(new Error('Không thể đọc ảnh bìa.')); element.src = source })
    const size = Math.min(image.width, image.height); const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 720
    const context = canvas.getContext('2d'); if (!context) throw new Error('Không thể xử lý ảnh bìa.')
    context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 720, 720)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally { URL.revokeObjectURL(source) }
}

export function CmsMusicAlbumForm({ artists, genres, tracks }: { artists: ArtistOption[]; uploadArtists: { slug: string; name: string }[]; genres: GenreOption[]; tracks: ExistingTrack[] }) {
  const capability = useCmsMusicCapability()
  const [title, setTitle] = useState('')
  const [artistId, setArtistId] = useState('')
  const [description, setDescription] = useState('')
  const [coverDataUrl, setCoverDataUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [slots, setSlots] = useState([1])
  const [uploaded, setUploaded] = useState<Record<number, UploadedTrack>>({})
  const [trackMode, setTrackMode] = useState<'upload' | 'select'>('upload')
  const [trackQuery, setTrackQuery] = useState('')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const artist = artists.find((item) => item.id === artistId)
  const uploadedTrackIds = slots.flatMap((slot) => uploaded[slot] ? [uploaded[slot].trackId] : [])
  const visibleTracks = useMemo(() => { const query = trackQuery.trim().toLowerCase(); return tracks.filter((track) => !query || [track.title, track.artist, track.musicCode, track.type].some((value) => value?.toLowerCase().includes(query))) }, [trackQuery, tracks])
  const ready = uploadedTrackIds.length > 0 || selectedTrackIds.length > 0

  async function createAlbum() {
    if (!ready || !title.trim()) return
    setIsSaving(true); setMessage('Đang tạo Album và gắn cover cho các track...')
    try {
      const response = await fetch('/api/cms/music/albums', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) }, body: JSON.stringify({ title, description, artistId: artistId || undefined, musician: artist?.name || '', musicCategory: '', isPublic, trackIds: [...new Set([...uploadedTrackIds, ...selectedTrackIds])], uploadedTrackIds, coverDataUrl: coverDataUrl || undefined }) })
      const result = await response.json() as { ok?: boolean; message?: string }
      setMessage(result.message || (result.ok ? 'Đã tạo Album.' : 'Không thể tạo Album.'))
    } catch { setMessage('Không thể kết nối để tạo Album.') } finally { setIsSaving(false) }
  }

  return <div className="form-shell cms-embedded-form">
    <div className="cms-form-two"><div className="field"><label>Tên Album / EP</label><input required value={title} onChange={(event) => setTitle(event.currentTarget.value)} placeholder="Ví dụ: After Midnight EP" /></div><div className="field"><label>Nghệ sĩ phát hành</label><select value={artistId} onChange={(event) => setArtistId(event.currentTarget.value)}><option value="">Chưa gắn nghệ sĩ</option>{artists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
    <div className="field"><label>Mô tả Album</label><textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="Giới thiệu ngắn về Album / EP" /></div>
    <div className="field"><label>Ảnh bìa Album</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event: ChangeEvent<HTMLInputElement>) => { const file = event.currentTarget.files?.[0]; if (file) setCoverDataUrl(await cropCover(file)) }} />{coverDataUrl ? <img className="cms-album-cover-preview" src={coverDataUrl} alt="Ảnh bìa Album" /> : null}</div>
    <label className="cms-checkbox-row"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.currentTarget.checked)} />Public Album sau khi tạo</label>
    <section className="cms-album-upload-panel"><div className="cms-panel-head-inline"><div><p className="section-eyebrow">Album tracks</p><h2>Track trong Album</h2><p className="cms-muted">Track upload dùng cover Album; track chọn từ thư viện giữ nguyên cover hiện có.</p></div></div><div className="cms-booking-tabs"><button type="button" className={trackMode === 'upload' ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} onClick={() => setTrackMode('upload')}>Upload track</button><button type="button" className={trackMode === 'select' ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} onClick={() => setTrackMode('select')}>Chọn nhạc có sẵn</button></div>{trackMode === 'upload' ? <><div className="cms-muted">Đã upload {uploadedTrackIds.length} track cho Album này.</div>{slots.map((slot, index) => <CmsAlbumTrackUploader key={slot} index={index + 1} albumLabel={title} artistSlug={artist?.slug || ''} onUploaded={(track) => setUploaded((current) => ({ ...current, [slot]: track }))} />)}<div className="cms-inline-actions"><button type="button" className="button-secondary" disabled={!uploaded[slots[slots.length - 1]]} onClick={() => setSlots((current) => [...current, current.length + 1])}>Thêm track</button></div></> : <><div className="cms-album-track-search"><input type="search" value={trackQuery} onChange={(event) => setTrackQuery(event.currentTarget.value)} placeholder="Tìm tên bài, mã nhạc hoặc nghệ sĩ" /><span>{visibleTracks.length}/{tracks.length}</span></div><div className="artist-album-track-list">{visibleTracks.map((track, index) => { const selected = selectedTrackIds.includes(track.id); return <article key={track.id} className={selected ? 'is-selected' : ''}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{track.title}</strong><small>{track.artist} · {track.duration}{track.musicCode ? ` · #${track.musicCode}` : ''}</small></div><button type="button" onClick={() => setSelectedTrackIds((current) => selected ? current.filter((id) => id !== track.id) : [...current, track.id])}>{selected ? <Minus size={16} /> : <Plus size={16} />}</button></article> })}</div></>}</section>
    <div className="cms-inline-actions"><button type="button" className="button" disabled={!ready || isSaving} onClick={createAlbum}>{isSaving ? 'Đang tạo Album...' : 'Tạo Album / EP'}</button></div>
    {message ? <p className="cms-muted" role="status">{message}</p> : null}
  </div>
}
