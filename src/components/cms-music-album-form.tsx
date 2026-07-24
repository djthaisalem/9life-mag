'use client'

import { Minus, Plus } from 'lucide-react'
import { type ChangeEvent, useMemo, useState } from 'react'

import { CmsMusicUploadForm } from '@/components/cms-music-upload-form'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type ArtistOption = { id: string; name: string; slug: string }
type UploadArtistOption = { slug: string; name: string }
type GenreOption = { id: string; slug: string; name: string }
type TrackOption = { id: string; title: string; artist: string; type: string; duration: string; musicCode?: string }
type CreatedAlbum = { id: string; title: string; artistSlug: string; isPublic: boolean }

async function cropCover(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh bìa tối đa 10MB.')
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Không thể đọc ảnh bìa này.'))
      element.src = sourceUrl
    })
    const cropSize = Math.min(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 720
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể xử lý ảnh bìa.')
    context.drawImage(image, (image.width - cropSize) / 2, (image.height - cropSize) / 2, cropSize, cropSize, 0, 0, 720, 720)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export function CmsMusicAlbumForm({
  artists,
  uploadArtists,
  genres,
  tracks,
}: {
  artists: ArtistOption[]
  uploadArtists: UploadArtistOption[]
  genres: GenreOption[]
  tracks: TrackOption[]
}) {
  const musicCapability = useCmsMusicCapability()
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [trackQuery, setTrackQuery] = useState('')
  const [coverDataUrl, setCoverDataUrl] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [artistId, setArtistId] = useState('')
  const [trackUploaderKey, setTrackUploaderKey] = useState(0)
  const [isTrackUploaderOpen, setIsTrackUploaderOpen] = useState(true)
  const [uploadedTracks, setUploadedTracks] = useState<Array<{ id: string; title: string; musicCode: string }>>([])

  const visibleTracks = useMemo(() => {
    const query = trackQuery.trim().toLowerCase()
    if (!query) return tracks
    return tracks.filter((track) => [track.title, track.artist, track.musicCode, track.type].some((value) => value?.toLowerCase().includes(query)))
  }, [trackQuery, tracks])

  function toggleTrack(trackId: string) {
    setSelectedTrackIds((current) => current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId])
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setCoverDataUrl(await cropCover(file))
      setIsError(false)
      setMessage('Ảnh bìa đã được crop vuông và sẵn sàng lưu cùng Album.')
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Không thể xử lý ảnh bìa.')
    }
  }

  async function createAlbum(form: HTMLFormElement) {
    const formData = new FormData(form)
    setIsPending(true)
    setIsError(false)
    setMessage('Đang tạo Album / EP...')

    try {
      const releaseDate = String(formData.get('releaseDate') ?? '')
      const response = await fetch('/api/cms/music/albums', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(formData.get('title') ?? ''),
          description: String(formData.get('description') ?? ''),
          artistId: String(formData.get('artistId') ?? ''),
          musician: String(formData.get('musician') ?? ''),
          musicCategory: String(formData.get('musicCategory') ?? ''),
          releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
          isPublic: formData.get('isPublic') === 'on',
          trackIds: [...new Set([...selectedTrackIds, ...uploadedTracks.map((track) => track.id)])],
          coverDataUrl: coverDataUrl || undefined,
        }),
      })
      const result = await response.json() as { ok?: boolean; message?: string; album?: CreatedAlbum }
      if (!response.ok || !result.ok || !result.album) throw new Error(result.message || 'Không thể tạo Album / EP.')

      setMessage(result.message || 'Đã tạo Album / EP.')
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Không thể kết nối đến tiến trình tạo Album / EP.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <form className="form-shell cms-embedded-form" onSubmit={(event) => { event.preventDefault(); void createAlbum(event.currentTarget) }}>
        <div className="cms-form-two">
          <div className="field"><label htmlFor="albumTitle">Tên Album / EP</label><input id="albumTitle" name="title" required maxLength={180} value={albumTitle} onChange={(event) => setAlbumTitle(event.currentTarget.value)} placeholder="Ví dụ: After Midnight EP" /></div>
          <div className="field"><label htmlFor="albumArtist">Nghệ sĩ phát hành</label><select id="albumArtist" name="artistId" value={artistId} onChange={(event) => setArtistId(event.currentTarget.value)}><option value="">Chưa gắn nghệ sĩ</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></div>
        </div>
        <div className="cms-form-two">
          <div className="field"><label htmlFor="albumCategory">Định dạng / thể loại</label><input id="albumCategory" name="musicCategory" maxLength={120} placeholder="Album, EP, Mixtape hoặc DJ set" /></div>
          <div className="field"><label htmlFor="albumReleaseDate">Ngày phát hành</label><input id="albumReleaseDate" name="releaseDate" type="date" /></div>
        </div>
        <div className="field"><label htmlFor="albumMusician">Credit hiển thị</label><input id="albumMusician" name="musician" maxLength={160} placeholder="Để trống nếu dùng nghệ sĩ đã chọn" /></div>
        <div className="field"><label htmlFor="albumDescription">Mô tả Album / EP</label><textarea id="albumDescription" name="description" maxLength={1200} placeholder="Giới thiệu ngắn về concept, âm nhạc và bối cảnh phát hành." /></div>
        <div className="field"><label htmlFor="albumCover">Ảnh bìa Album</label><input id="albumCover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleCoverChange(event)} /><span className="cms-muted">Ảnh được crop vuông 1:1 trước khi lưu vào Media/R2.</span>{coverDataUrl ? <img className="cms-album-cover-preview" src={coverDataUrl} alt="Xem trước ảnh bìa Album" /> : null}</div>
        <label className="cms-checkbox-row"><input name="isPublic" type="checkbox" />Public ngay sau khi tạo</label>

        <div className="artist-album-track-picker">
          <div className="artist-album-track-picker-head"><span>Kho nhạc đã upload</span><strong>{selectedTrackIds.length} track đã chọn</strong></div>
          <div className="cms-album-track-search"><input type="search" value={trackQuery} onChange={(event) => setTrackQuery(event.target.value)} placeholder="Tìm tên bài, mã nhạc, nghệ sĩ hoặc loại nội dung" aria-label="Tìm trong kho nhạc" /><span>{visibleTracks.length}/{tracks.length}</span></div>
          <div className="artist-album-track-list">
            {visibleTracks.map((track, index) => {
              const isSelected = selectedTrackIds.includes(track.id)
              return <article key={track.id} className={isSelected ? 'is-selected' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{track.title}</strong><small>{track.artist} · {track.type} · {track.duration}{track.musicCode ? ` · #${track.musicCode}` : ''}</small></div>
                <button type="button" onClick={() => toggleTrack(track.id)} aria-label={`${isSelected ? 'Gỡ' : 'Thêm'} ${track.title}`}>{isSelected ? <Minus size={16} /> : <Plus size={16} />}</button>
              </article>
            })}
            {!visibleTracks.length ? <p className="cms-muted">Không tìm thấy track phù hợp.</p> : null}
          </div>
        </div>

        <div className="cms-inline-actions"><button type="submit" className="button" disabled={isPending || !albumTitle.trim() || !uploadedTracks.length}>{isPending ? 'Đang tạo...' : 'Tạo Album / EP'}</button></div>
        {!uploadedTracks.length ? <p className="cms-muted">Upload ít nhất một track bên dưới trước khi tạo Album / EP.</p> : null}
        {message ? <p className={isError ? 'cms-form-message cms-form-message-error' : 'cms-form-message'} role="status">{message}</p> : null}
      </form>

      <article className="cms-album-upload-panel">
        <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Album tracks</p><h2>Track {uploadedTracks.length + 1}</h2><p className="cms-muted">Đặt tiêu đề, chọn file và upload từng track. Khi hoàn tất, bấm Tạo Album / EP để lưu tất cả vào cùng một album.</p></div></div>
        {uploadedTracks.length ? <div className="artist-album-track-list">{uploadedTracks.map((track, index) => <article key={track.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>Track {index + 1}: {track.title}</strong><small>Mã nhạc: #{track.musicCode}</small></div></article>)}</div> : null}
        {isTrackUploaderOpen ? <CmsMusicUploadForm key={trackUploaderKey} artists={uploadArtists} genres={genres} albums={[]} defaultAlbumLabel={albumTitle} defaultArtistSlug={artists.find((artist) => artist.id === artistId)?.slug ?? ''} forceTrackType onUploaded={(result) => { setUploadedTracks((current) => [...current, { id: result.trackId, title: result.slug || result.musicCode, musicCode: result.musicCode }]); setIsTrackUploaderOpen(false) }} /> : <div className="cms-inline-actions"><button type="button" className="button-secondary" onClick={() => { setTrackUploaderKey((current) => current + 1); setIsTrackUploaderOpen(true) }}>Thêm track</button></div>}
      </article>
    </>
  )
}
