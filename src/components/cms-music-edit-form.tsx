'use client'

import { useState } from 'react'
import { useCmsMusicCapability } from '@/components/cms-capability-provider'

type Option = { value: string; label: string }

type MusicEditValue = {
  slug: string
  title: string
  type: 'track' | 'nonstop' | 'remix' | 'album'
  genre: string
  artistSlug: string
  access: 'public' | 'stars' | 'premium' | 'internal'
  visibility: 'draft' | 'pending' | 'public' | 'hidden'
  durationLabel: string
  playbackStarCost: number
  downloadStarCost: number
  isDownloadDisabled: boolean
  albumLabel: string
  selectedMaps: string[]
  masterR2Key: string
  isDatabaseRecord: boolean
}

export function CmsMusicEditForm({
  music,
  artists,
  genres,
  albums,
  displayMapOptions,
  accessOptions,
  visibilityOptions,
}: {
  music: MusicEditValue
  artists: Option[]
  genres: Option[]
  albums: Option[]
  displayMapOptions: readonly string[]
  accessOptions: readonly Option[]
  visibilityOptions: readonly Option[]
}) {
  const musicCapability = useCmsMusicCapability()
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function save(form: HTMLFormElement, forceDraft = false) {
    if (!music.isDatabaseRecord) {
      setIsError(true)
      setMessage('Đây là dữ liệu mẫu nên chưa thể lưu. Hãy chỉnh một track đã upload vào database.')
      return
    }

    const formData = new FormData(form)
    setIsPending(true)
    setIsError(false)
    setMessage(forceDraft ? 'Đang lưu bản nháp...' : 'Đang lưu thay đổi...')

    try {
      const response = await fetch(`/cms/api/music/${encodeURIComponent(music.slug)}`, {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(musicCapability ? { Authorization: `Bearer ${musicCapability}` } : {}),
        },
        body: JSON.stringify({
          title: String(formData.get('title') ?? ''),
          type: String(formData.get('type') ?? 'track'),
          genre: String(formData.get('genre') ?? ''),
          artistSlug: String(formData.get('artistSlug') ?? ''),
          access: String(formData.get('access') ?? 'public'),
          visibility: forceDraft ? 'draft' : String(formData.get('visibility') ?? 'draft'),
          durationLabel: String(formData.get('durationLabel') ?? ''),
          playbackStarCost: Number(formData.get('playbackStarCost') ?? 0),
          downloadStarCost: Number(formData.get('downloadStarCost') ?? 0),
          isDownloadDisabled: formData.get('isDownloadDisabled') === 'on',
          albumLabel: String(formData.get('albumLabel') ?? ''),
          displayMap: formData.getAll('displayMap').map(String),
        }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) {
        setIsError(true)
        setMessage(result.message ?? 'Không thể lưu thay đổi.')
        return
      }

      setMessage(result.message ?? 'Đã lưu thay đổi.')
    } catch {
      setIsError(true)
      setMessage('Không kết nối được đến tiến trình lưu track.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="form-shell cms-embedded-form" onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget) }}>
      <div className="field"><label htmlFor="musicTitle">Tên nội dung</label><input id="musicTitle" name="title" defaultValue={music.title} required maxLength={180} /></div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicType">Loại nội dung</label><select id="musicType" name="type" defaultValue={music.type}><option value="track">Track</option><option value="nonstop">Nonstop</option><option value="remix">Remix</option><option value="album">Album / EP</option></select></div>
        <div className="field"><label htmlFor="musicGenre">Thể loại</label><select id="musicGenre" name="genre" defaultValue={music.genre}><option value="">Chưa phân loại</option>{genres.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicArtist">Nghệ sĩ</label><select id="musicArtist" name="artistSlug" defaultValue={music.artistSlug}><option value="">Để trống nếu chưa gắn nghệ sĩ</option>{artists.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div className="field"><label htmlFor="musicAccess">Quyền truy cập</label><select id="musicAccess" name="access" defaultValue={music.access}>{accessOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="musicVisibility">Hiển thị</label><select id="musicVisibility" name="visibility" defaultValue={music.visibility}>{visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div className="field"><label htmlFor="musicDuration">Thời lượng</label><input id="musicDuration" name="durationLabel" defaultValue={music.durationLabel} maxLength={20} /><span className="cms-muted">Thời lượng được tự đọc khi upload; chỉ chỉnh khi cần hiệu chỉnh dữ liệu cũ.</span></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="playbackStarCost">Sao để nghe</label><input id="playbackStarCost" name="playbackStarCost" type="number" min="0" step="1" defaultValue={music.playbackStarCost} /><span className="cms-muted">Để 0 nếu nghe miễn phí.</span></div>
        <div className="field"><label htmlFor="downloadStarCost">Sao để tải</label><input id="downloadStarCost" name="downloadStarCost" type="number" min="0" step="1" defaultValue={music.downloadStarCost} /><label className="cms-checkbox-row"><input name="isDownloadDisabled" type="checkbox" defaultChecked={music.isDownloadDisabled} />Không cho tải xuống</label><span className="cms-muted">Bật tuỳ chọn này để chặn tải file, kể cả khi giảm chi phí về 0.</span></div>
      </div>
      <div className="field"><label htmlFor="musicAlbum">Gắn vào Album / EP</label><select id="musicAlbum" name="albumLabel" defaultValue={music.albumLabel}><option value="">Không thuộc album</option>{albums.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <fieldset className="cms-map-fieldset"><legend>Map hiển thị trên site</legend><p>Chọn các khu vực được phép hiển thị nội dung này.</p><div className="cms-map-option-grid">{displayMapOptions.map((option) => <label key={option}><input type="checkbox" name="displayMap" value={option} defaultChecked={music.selectedMaps.includes(option)} />{option}</label>)}</div></fieldset>
      <div className="field"><label htmlFor="musicSource">Nguồn file / R2 key</label><input id="musicSource" value={music.masterR2Key} readOnly /></div>
      <div className="cms-inline-actions">
        <button type="submit" className="button" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        <button type="button" className="button-secondary" disabled={isPending} onClick={(event) => { if (event.currentTarget.form) void save(event.currentTarget.form, true) }}>Lưu nháp</button>
      </div>
      {message ? <p className={isError ? 'cms-form-message cms-form-message-error' : 'cms-form-message'} role="status">{message}</p> : null}
    </form>
  )
}
