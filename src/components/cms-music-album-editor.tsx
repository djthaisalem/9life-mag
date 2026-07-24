'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type Track = { id: string; title: string; artist: string; duration: string; musicCode: string }

export function CmsMusicAlbumEditor({ albumId, initialTrackIds, tracks }: { albumId: string; initialTrackIds: string[]; tracks: Track[] }) {
  const capability = useCmsMusicCapability()
  const [selected, setSelected] = useState(initialTrackIds)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    setMessage('')
    try {
      const response = await fetch(`/api/cms/music/albums/${encodeURIComponent(albumId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({ trackIds: selected }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      setMessage(result.ok ? 'Đã lưu danh sách track của Album.' : result.message ?? 'Không thể lưu Album.')
    } catch {
      setMessage('Không thể kết nối tới tiến trình lưu Album.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="artist-album-track-picker">
    <div className="artist-album-track-picker-head"><span>Track trong Album</span><strong>{selected.length} track</strong></div>
    <div className="artist-album-track-list">
      {tracks.map((track, index) => {
        const included = selected.includes(track.id)
        return <article key={track.id} className={included ? 'is-selected' : ''}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div><strong>{track.title}</strong><small>{track.artist} · {track.duration} · #{track.musicCode}</small></div>
          <button type="button" onClick={() => setSelected((current) => included ? current.filter((id) => id !== track.id) : [...current, track.id])} aria-label={included ? `Bỏ ${track.title}` : `Thêm ${track.title}`}>{included ? <Minus size={16} /> : <Plus size={16} />}</button>
        </article>
      })}
    </div>
    <div className="cms-inline-actions"><button type="button" className="button" disabled={isSaving} onClick={save}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
    {message ? <p className="cms-muted" role="status">{message}</p> : null}
  </div>
}
