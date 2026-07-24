'use client'

import { Minus, Plus } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type Track = { id: string; title: string; artist: string; duration: string; musicCode: string }
type Album = { title: string; description: string; isPublic: boolean; coverUrl: string }

async function cropCover(file: File) {
  const source = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Không thể đọc ảnh cover.'))
      element.src = source
    })
    const size = Math.min(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 720
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể xử lý ảnh cover.')
    context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 720, 720)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally {
    URL.revokeObjectURL(source)
  }
}

export function CmsMusicAlbumEditor({ albumId, initialAlbum, initialTrackIds, tracks }: { albumId: string; initialAlbum: Album; initialTrackIds: string[]; tracks: Track[] }) {
  const capability = useCmsMusicCapability()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [isPublic, setIsPublic] = useState(initialAlbum.isPublic)
  const [coverDataUrl, setCoverDataUrl] = useState('')
  const [selected, setSelected] = useState(initialTrackIds)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    const title = titleInputRef.current?.value.trim() ?? ''
    const description = descriptionInputRef.current?.value.trim() ?? ''
    if (!title || !selected.length) {
      setMessage('Vui lòng nhập tên Album và chọn ít nhất một track.')
      return
    }

    setIsSaving(true)
    setMessage('')
    try {
      const response = await fetch(`/api/cms/music/albums/${encodeURIComponent(albumId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({ title, description, isPublic, displayMap: isPublic ? 'Music - Album / release' : '', coverDataUrl: coverDataUrl || undefined, trackIds: selected }),
      })
      const result = await response.json().catch(() => ({})) as { ok?: boolean; message?: string }
      setMessage(result.ok ? 'Đã lưu Album và cập nhật vị trí hiển thị.' : result.message ?? `Không thể lưu Album (HTTP ${response.status}).`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối tới tiến trình lưu Album.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="artist-album-track-picker" data-cms-text-repair-ignore>
    <div className="cms-form-two">
      <div className="field"><label>Tên Album / EP</label><input ref={titleInputRef} defaultValue={initialAlbum.title} /></div>
      <label className="cms-checkbox-row"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.currentTarget.checked)} />Hiển thị Album trên site Music</label>
    </div>
    <div className="field"><label>Mô tả Album</label><textarea ref={descriptionInputRef} defaultValue={initialAlbum.description} /></div>
    <div className="field"><label>Ảnh cover Album</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0]
      if (file) setCoverDataUrl(await cropCover(file))
    }} />{coverDataUrl || initialAlbum.coverUrl ? <img className="cms-album-cover-preview" src={coverDataUrl || initialAlbum.coverUrl} alt="Cover Album" /> : null}</div>
    <div className="artist-album-track-picker-head"><span>Track trong Album</span><strong>{selected.length} track</strong></div>
    <div className="artist-album-track-list">
      {tracks.map((track, index) => {
        const included = selected.includes(track.id)
        return <article key={track.id} className={included ? 'is-selected' : ''}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{track.title}</strong><small>{track.artist} · {track.duration} · #{track.musicCode}</small></div><button type="button" onClick={() => setSelected((current) => included ? current.filter((id) => id !== track.id) : [...current, track.id])} aria-label={included ? `Bỏ ${track.title}` : `Thêm ${track.title}`}>{included ? <Minus size={16} /> : <Plus size={16} />}</button></article>
      })}
    </div>
    <div className="cms-inline-actions"><button type="button" className="button" disabled={isSaving || !selected.length} onClick={() => void save()}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi Album'}</button></div>
    {message ? <p className="cms-muted" role="status">{message}</p> : null}
  </div>
}
