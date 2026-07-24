'use client'

import { type ChangeEvent, useState } from 'react'
import { CmsAlbumTrackUploader } from '@/components/cms-album-track-uploader'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type ArtistOption = { id: string; name: string; slug: string }
type GenreOption = { id: string; slug: string; name: string }
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

export function CmsMusicAlbumForm({ artists, genres }: { artists: ArtistOption[]; uploadArtists: { slug: string; name: string }[]; genres: GenreOption[]; tracks: unknown[] }) {
  const capability = useCmsMusicCapability()
  const [title, setTitle] = useState('')
  const [artistId, setArtistId] = useState('')
  const [description, setDescription] = useState('')
  const [coverDataUrl, setCoverDataUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [slots, setSlots] = useState([1])
  const [uploaded, setUploaded] = useState<Record<number, UploadedTrack>>({})
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const artist = artists.find((item) => item.id === artistId)
  const ready = slots.length > 0 && slots.every((slot) => uploaded[slot])

  async function createAlbum() {
    if (!ready || !title.trim()) return
    setIsSaving(true); setMessage('Đang tạo Album và gắn cover cho các track...')
    try {
      const response = await fetch('/api/cms/music/albums', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) }, body: JSON.stringify({ title, description, artistId: artistId || undefined, musician: artist?.name || '', musicCategory: '', isPublic, trackIds: slots.map((slot) => uploaded[slot].trackId), coverDataUrl: coverDataUrl || undefined }) })
      const result = await response.json() as { ok?: boolean; message?: string }
      setMessage(result.message || (result.ok ? 'Đã tạo Album.' : 'Không thể tạo Album.'))
    } catch { setMessage('Không thể kết nối để tạo Album.') } finally { setIsSaving(false) }
  }

  return <div className="form-shell cms-embedded-form">
    <div className="cms-form-two"><div className="field"><label>Tên Album / EP</label><input required value={title} onChange={(event) => setTitle(event.currentTarget.value)} placeholder="Ví dụ: After Midnight EP" /></div><div className="field"><label>Nghệ sĩ phát hành</label><select value={artistId} onChange={(event) => setArtistId(event.currentTarget.value)}><option value="">Chưa gắn nghệ sĩ</option>{artists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
    <div className="field"><label>Mô tả Album</label><textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="Giới thiệu ngắn về Album / EP" /></div>
    <div className="field"><label>Ảnh bìa Album</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event: ChangeEvent<HTMLInputElement>) => { const file = event.currentTarget.files?.[0]; if (file) setCoverDataUrl(await cropCover(file)) }} />{coverDataUrl ? <img className="cms-album-cover-preview" src={coverDataUrl} alt="Ảnh bìa Album" /> : null}</div>
    <label className="cms-checkbox-row"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.currentTarget.checked)} />Public Album sau khi tạo</label>
    <section className="cms-album-upload-panel"><div className="cms-panel-head-inline"><div><p className="section-eyebrow">Track upload</p><h2>Track trong Album</h2><p className="cms-muted">Mỗi track dùng chung cover Album, hiển thị trong Album và vẫn có thể tìm kiếm hoặc thêm vào playlist.</p></div></div>{slots.map((slot, index) => <CmsAlbumTrackUploader key={slot} index={index + 1} albumLabel={title} artistSlug={artist?.slug || ''} onUploaded={(track) => setUploaded((current) => ({ ...current, [slot]: track }))} />)}<div className="cms-inline-actions"><button type="button" className="button-secondary" disabled={!uploaded[slots[slots.length - 1]]} onClick={() => setSlots((current) => [...current, current.length + 1])}>Thêm track</button></div></section>
    <div className="cms-inline-actions"><button type="button" className="button" disabled={!ready || isSaving} onClick={createAlbum}>{isSaving ? 'Đang tạo Album...' : 'Tạo Album / EP'}</button></div>
    {message ? <p className="cms-muted" role="status">{message}</p> : null}
  </div>
}
