'use client'

import { useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type UploadedTrack = { trackId: string; slug: string; musicCode: string }

export function CmsAlbumTrackUploader({ index, albumLabel, artistSlug, onUploaded }: { index: number; albumLabel: string; artistSlug: string; onUploaded: (track: UploadedTrack) => void }) {
  const capability = useCmsMusicCapability()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [completed, setCompleted] = useState<UploadedTrack | null>(null)

  const headers: Record<string, string> = capability ? { Authorization: `Bearer ${capability}` } : {}

  async function getDuration(audio: File) {
    const url = URL.createObjectURL(audio)
    try {
      return await new Promise<number>((resolve, reject) => {
        const element = document.createElement('audio')
        element.preload = 'metadata'
        element.onloadedmetadata = () => Number.isFinite(element.duration) ? resolve(element.duration) : reject(new Error('duration'))
        element.onerror = () => reject(new Error('duration'))
        element.src = url
      })
    } finally { URL.revokeObjectURL(url) }
  }

  async function upload() {
    if (!title.trim() || !file || !albumLabel.trim()) { setMessage('Nhập tên Album, tiêu đề track và chọn file nhạc trước khi upload.'); return }
    setIsPending(true); setMessage('Đang upload track...')
    try {
      let result: UploadedTrack
      if (file.name.toLowerCase().endsWith('.mp3')) {
        const prepare = await fetch('/cms/api/music/upload/direct', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ action: 'prepare', title, type: 'track', genre: '', artistSlug, access: 'public', displayMap: '', albumLabel, visibility: 'draft', fileName: file.name, fileSize: file.size, contentType: file.type || 'audio/mpeg' }) })
        const prepared = await prepare.json() as { ok?: boolean; message?: string; result?: { uploadUrl: string; ticket: string } }
        if (!prepared.ok || !prepared.result) throw new Error(prepared.message || 'Không thể chuẩn bị upload.')
        const durationSeconds = await getDuration(file)
        await new Promise<void>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open('PUT', prepared.result!.uploadUrl); xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg'); xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 trả về ${xhr.status}`)); xhr.onerror = () => reject(new Error('Không thể gửi file lên R2.')); xhr.send(file) })
        const complete = await fetch('/cms/api/music/upload/direct', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ action: 'complete', ticket: prepared.result.ticket, durationSeconds }) })
        const payload = await complete.json() as { ok?: boolean; message?: string; result?: UploadedTrack }
        if (!payload.ok || !payload.result) throw new Error(payload.message || 'Không thể hoàn tất track.')
        result = payload.result
      } else {
        const form = new FormData(); form.set('title', title); form.set('type', 'track'); form.set('artistSlug', artistSlug); form.set('access', 'public'); form.set('visibility', 'draft'); form.set('albumLabel', albumLabel); form.set('audio', file)
        const response = await fetch('/cms/api/music/upload', { method: 'POST', credentials: 'include', headers, body: form })
        const payload = await response.json() as { ok?: boolean; message?: string; result?: UploadedTrack }
        if (!payload.ok || !payload.result) throw new Error(payload.message || 'Không thể xử lý track.')
        result = payload.result
      }
      setCompleted(result); onUploaded(result); setMessage(`Đã upload Track ${index}. Mã nhạc: ${result.musicCode}.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể upload track.') } finally { setIsPending(false) }
  }

  return <article className="cms-security-panel">
    <strong>Track {index}</strong>
    <div className="field"><label>Tiêu đề track {index}</label><input value={title} disabled={Boolean(completed)} onChange={(event) => setTitle(event.currentTarget.value)} placeholder={`Track ${index}`} /></div>
    <div className="field"><label>File nhạc track {index}</label><input type="file" disabled={Boolean(completed)} accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} /></div>
    {!completed ? <button type="button" className="button-secondary" disabled={isPending} onClick={upload}>{isPending ? 'Đang upload...' : `Upload track ${index}`}</button> : <p className="cms-muted">Đã lưu: {title} · #{completed.musicCode}</p>}
    {message ? <p className="cms-muted" role="status">{message}</p> : null}
  </article>
}
