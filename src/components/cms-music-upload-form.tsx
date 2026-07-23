'use client'

import { FormEvent, useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type ArtistOption = { slug: string; name: string }
type GenreOption = { id: string; slug: string; name: string }
type AlbumOption = { id: string; title: string; artist: string }

type UploadResult = { durationLabel: string; previewKey: string; masterKey: string; musicCode: string; coverR2Key: string; visibility: 'draft' | 'pending' | 'public' | 'hidden' }

const displayMapOptions = ['Trang chủ - Nonstop picks', 'Trang chủ - Top Remix', 'Music - Hero exclusive', 'Music - DJ sets community', 'Music - Remix đang lên', 'Music - Album / release', 'Music - Artist spotlight', 'Profile nghệ sĩ', 'Playlist User nổi bật'] as const

export function CmsMusicUploadForm({ artists, genres, albums }: { artists: ArtistOption[]; genres: GenreOption[]; albums: AlbumOption[] }) {
  const uploadCapability = useCmsMusicCapability()
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setIsPending(true)
    setMessage('Đang tạo mã nhạc, chuẩn hóa metadata, xuất MP3 256 kbps và upload lên R2...')
    setResult(null)

    try {
      const response = await fetch('/cms/api/music/upload', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: uploadCapability ? { Authorization: `Bearer ${uploadCapability}` } : undefined,
        body: new FormData(form),
      })
      const payload = await response.json() as { ok?: boolean; message?: string; result?: UploadResult }
      if (!response.ok || !payload.ok || !payload.result) {
        setMessage(payload.message ?? 'Không thể xử lý file nhạc.')
        return
      }
      setResult(payload.result)
      setMessage(`Đã xử lý xong. Mã nhạc: ${payload.result.musicCode}. Thời lượng: ${payload.result.durationLabel}.`)
      form.reset()
    } catch {
      setMessage('Không kết nối được đến tiến trình xử lý nhạc.')
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
        <div className="field"><label htmlFor="musicAlbum">Gắn vào Album / EP</label><select id="musicAlbum" name="albumLabel" defaultValue=""><option value="">Không thuộc album</option>{albums.map((album) => <option key={album.id} value={album.title}>{album.title} · {album.artist}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="musicAudio">File nhạc gốc</label><input id="musicAudio" name="audio" type="file" required accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/aac" /><span className="cms-muted">Hỗ trợ MP3, WAV, FLAC, M4A, AAC. Hệ thống tự tạo bản phát MP3 256 kbps và giữ master riêng cho download.</span></div>
      <fieldset className="cms-map-fieldset"><legend>Map hiển thị trên site</legend><p>Chọn các khu vực được phép hiển thị nội dung này.</p><div className="cms-map-option-grid">{displayMapOptions.map((option) => <label key={option}><input type="checkbox" name="displayMap" value={option} />{option}</label>)}</div></fieldset>
      <div className="cms-inline-actions"><button type="submit" className="button" disabled={isPending}>{isPending ? 'Đang xử lý...' : 'Xử lý và upload nhạc'}</button></div>
      {message ? <p className="cms-muted" role="status">{message}</p> : null}
      {result ? <div className="cms-security-panel"><strong>{result.visibility === 'public' ? 'Đã upload và public track' : result.visibility === 'pending' ? 'Đã upload, đang chờ duyệt' : 'Đã tạo track nháp'}</strong><p>Mã quản lý: {result.musicCode}</p><p>Bản phát: {result.previewKey}</p><p>Download: {result.masterKey}</p><p>Cover mặc định: {result.coverR2Key}</p></div> : null}
    </form>
  )
}
