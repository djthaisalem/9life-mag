'use client'

import { FormEvent, useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type ArtistOption = { slug: string; name: string }
type GenreOption = { id: string; slug: string; name: string }
type AlbumOption = { id: string; title: string; artist: string }

type UploadResult = { trackId: string; durationLabel: string; previewKey: string; masterKey: string; musicCode: string; coverR2Key: string; visibility: 'draft' | 'pending' | 'public' | 'hidden' }
type DirectUploadPreparation = { uploadUrl: string; ticket: string; musicCode: string }

const displayMapOptions = ['Trang chủ - Nonstop picks', 'Trang chủ - Top Remix', 'Music - Hero exclusive', 'Music - DJ sets community', 'Music - Remix đang lên', 'Music - Album / release', 'Music - Artist spotlight', 'Profile nghệ sĩ', 'Playlist User nổi bật'] as const

export function CmsMusicUploadForm({ artists, genres, albums, defaultAlbumLabel = '', onUploaded }: { artists: ArtistOption[]; genres: GenreOption[]; albums: AlbumOption[]; defaultAlbumLabel?: string; onUploaded?: (result: UploadResult) => Promise<void> | void }) {
  const uploadCapability = useCmsMusicCapability()
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)

  function cmsHeaders() {
    return uploadCapability ? { Authorization: `Bearer ${uploadCapability}` } : undefined
  }

  async function readAudioDuration(audio: File) {
    const objectUrl = URL.createObjectURL(audio)
    try {
      return await new Promise<number>((resolve, reject) => {
        const preview = document.createElement('audio')
        preview.preload = 'metadata'
        preview.onloadedmetadata = () => Number.isFinite(preview.duration) && preview.duration > 0
          ? resolve(preview.duration)
          : reject(new Error('duration'))
        preview.onerror = () => reject(new Error('duration'))
        preview.src = objectUrl
      })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  function uploadFileToR2(uploadUrl: string, audio: File, onProgress: (percentage: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', audio.type || 'audio/mpeg')
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)))
      }
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`r2_http_${xhr.status}`))
      xhr.onerror = () => reject(new Error('r2_network'))
      xhr.onabort = () => reject(new Error('r2_aborted'))
      xhr.send(audio)
    })
  }

  async function uploadMp3Directly(form: HTMLFormElement, audio: File) {
    const formData = new FormData(form)
    const response = await fetch('/cms/api/music/upload/direct', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...cmsHeaders() },
      body: JSON.stringify({
        action: 'prepare',
        title: String(formData.get('title') ?? ''),
        type: String(formData.get('type') ?? 'track'),
        genre: String(formData.get('genre') ?? ''),
        artistSlug: String(formData.get('artistSlug') ?? ''),
        access: String(formData.get('access') ?? 'public'),
        displayMap: formData.getAll('displayMap').map(String).join(' / '),
        albumLabel: String(formData.get('albumLabel') ?? ''),
        visibility: String(formData.get('visibility') ?? 'draft'),
        fileName: audio.name,
        fileSize: audio.size,
        contentType: audio.type || 'audio/mpeg',
      }),
    })
    const prepared = await response.json() as { ok?: boolean; message?: string; result?: DirectUploadPreparation }
    if (!response.ok || !prepared.ok || !prepared.result) throw new Error(prepared.message ?? 'Không thể tạo phiên upload R2.')

    setMessage('Đang đọc thời lượng MP3...')
    const durationSeconds = await readAudioDuration(audio)
    setMessage('Đang upload trực tiếp lên R2: 0%')
    await uploadFileToR2(prepared.result.uploadUrl, audio, (percentage) => {
      setMessage(`Đang upload trực tiếp lên R2: ${percentage}%`)
    })

    setMessage('R2 đã nhận file. Đang tạo track và cập nhật CMS...')
    const completed = await fetch('/cms/api/music/upload/direct', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...cmsHeaders() },
      body: JSON.stringify({ action: 'complete', ticket: prepared.result.ticket, durationSeconds }),
    })
    const completedPayload = await completed.json() as { ok?: boolean; message?: string; result?: UploadResult }
    if (!completed.ok || !completedPayload.ok || !completedPayload.result) throw new Error(completedPayload.message ?? 'Không thể tạo track sau khi R2 nhận file.')
    return completedPayload.result
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setIsPending(true)
    setMessage('Đang tạo mã nhạc, kiểm tra định dạng, chuẩn hóa metadata và upload lên R2...')
    setResult(null)

    try {
      const selectedAudio = new FormData(form).get('audio')
      if (selectedAudio instanceof File && selectedAudio.name.toLowerCase().endsWith('.mp3')) {
        const directResult = await uploadMp3Directly(form, selectedAudio)
        await onUploaded?.(directResult)
        setResult(directResult)
        setMessage(`Đã xử lý xong. Mã nhạc: ${directResult.musicCode}. Thời lượng: ${directResult.durationLabel}.`)
        form.reset()
        return
      }

      const response = await fetch('/cms/api/music/upload', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: cmsHeaders(),
        body: new FormData(form),
      })
      const contentType = response.headers.get('content-type') ?? ''
      const payload = contentType.includes('application/json')
        ? await response.json() as { ok?: boolean; message?: string; result?: UploadResult }
        : null
      if (!response.ok || !payload?.ok || !payload.result) {
        const fallbackMessage = response.status === 413
          ? 'File nhạc vượt giới hạn upload của server hoặc proxy.'
          : `Server từ chối upload (HTTP ${response.status}).`
        setMessage(payload?.message ?? fallbackMessage)
        return
      }
      setResult(payload.result)
      await onUploaded?.(payload.result)
      setMessage(`Đã xử lý xong. Mã nhạc: ${payload.result.musicCode}. Thời lượng: ${payload.result.durationLabel}.`)
      form.reset()
    } catch (error) {
      const reason = error instanceof Error ? error.message : ''
      setMessage(reason.startsWith('r2_')
        ? 'Không thể upload trực tiếp lên R2. Hãy kiểm tra R2 CORS đã cho phép domain 9lifemag.com với phương thức PUT.'
        : reason || 'Kết nối upload bị ngắt trước khi server phản hồi. Với file WAV lớn, hãy kiểm tra giới hạn upload của IIS/Cloudflare.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="form-shell cms-embedded-form" onSubmit={handleSubmit}>
      <div className="field"><label htmlFor="musicTitle">Tên nội dung</label><input id="musicTitle" name="title" required placeholder="Water Lily Club Remix" /></div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicType">Loại file audio</label><select id="musicType" name="type" defaultValue="track"><option value="track">Track</option><option value="nonstop">Nonstop</option><option value="remix">Remix</option></select><span className="cms-muted">Album/EP là bộ sưu tập phát hành, không upload như một file audio.</span></div>
        <div className="field"><label htmlFor="musicGenre">Thể loại</label><select id="musicGenre" name="genre" defaultValue=""><option value="">Chọn thể loại</option>{genres.map((genre) => <option key={genre.id} value={genre.slug}>{genre.name}</option>)}</select></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicArtist">Nghệ sĩ</label><select id="musicArtist" name="artistSlug" defaultValue=""><option value="">Để trống nếu chưa gắn nghệ sĩ</option>{artists.map((artist) => <option key={artist.slug} value={artist.slug}>{artist.name}</option>)}</select></div>
        <div className="field"><label htmlFor="musicAccess">Quyền truy cập</label><select id="musicAccess" name="access" defaultValue="public"><option value="public">Công khai - nghe miễn phí</option><option value="stars">Trừ sao để phát</option><option value="premium">Chỉ Premium</option><option value="internal">Chỉ nội bộ CMS</option></select></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicVisibility">Hiển thị</label><select id="musicVisibility" name="visibility" defaultValue="draft"><option value="draft">Nháp nội bộ</option><option value="pending">Chờ admin duyệt</option><option value="public">Đang public</option><option value="hidden">Tạm ẩn</option></select><span className="cms-muted">Map vị trí không tự public. Track chỉ xuất hiện ngoài site khi chọn “Đang public”.</span></div>
        <div className="field"><label htmlFor="musicAlbum">Gắn vào Album / EP</label><select id="musicAlbum" name="albumLabel" defaultValue={defaultAlbumLabel}><option value="">Không thuộc album</option>{defaultAlbumLabel && !albums.some((album) => album.title === defaultAlbumLabel) ? <option value={defaultAlbumLabel}>{defaultAlbumLabel} · Album mới tạo</option> : null}{albums.map((album) => <option key={album.id} value={album.title}>{album.title} · {album.artist}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="musicAudio">File nhạc gốc</label><input id="musicAudio" name="audio" type="file" required accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac" /><span className="cms-muted">Hỗ trợ MP3, WAV, FLAC, M4A, AAC. MP3 dùng trực tiếp master để phát; các định dạng còn lại sẽ tạo thêm preview MP3 256 kbps. Master gốc vẫn được giữ cho download.</span></div>
      <fieldset className="cms-map-fieldset"><legend>Map hiển thị trên site</legend><p>Chọn các khu vực được phép hiển thị nội dung này.</p><div className="cms-map-option-grid">{displayMapOptions.map((option) => <label key={option}><input type="checkbox" name="displayMap" value={option} />{option}</label>)}</div></fieldset>
      <div className="cms-inline-actions"><button type="submit" className="button" disabled={isPending}>{isPending ? 'Đang xử lý...' : 'Xử lý và upload nhạc'}</button></div>
      {message ? <p className="cms-muted" role="status">{message}</p> : null}
      {result ? <div className="cms-security-panel"><strong>{result.visibility === 'public' ? 'Đã upload và public track' : result.visibility === 'pending' ? 'Đã upload, đang chờ duyệt' : 'Đã tạo track nháp'}</strong><p>Mã quản lý: {result.musicCode}</p><p>Bản phát: {result.previewKey}</p><p>Download: {result.masterKey}</p><p>Cover mặc định: {result.coverR2Key}</p></div> : null}
    </form>
  )
}
