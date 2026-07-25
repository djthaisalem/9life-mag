'use client'

import Link from 'next/link'
import { Minus, Plus } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { artistPortalSections, type ArtistPortalField, type ArtistPortalSection, type ArtistPortalTemplate } from '@/lib/artist-portal-sections'
import { getMediaEmbed } from '@/lib/media-embed'
import { StudentRegistrationSettings } from '@/components/student-registration-settings'

type ArtistPortalEditorPageProps = { section: ArtistPortalSection }
type StoredTemplateState = { values: Record<string, string>; files: Record<string, string> }
type StoredPortalState = Record<string, StoredTemplateState>

const ARTIST_PORTAL_STORAGE_KEY = 'nine-life-artist-portal-forms-v1'
const ARTIST_PORTAL_PROFILE_KEY = 'nine-life-artist-portal-profile-v1'
const DEFAULT_MUSIC_COVER = '/images/default-music-cover.png'
const musicCoverFields = new Set(['trackCover', 'playlistCover', 'albumCover'])
const imagePreviewFields = new Set([...musicCoverFields, 'portraitUpload', 'coverUpload'])

const profileFieldCopy: Record<string, { label: string; placeholder?: string; helper?: string }> = {
  artistName: { label: 'Tên nghệ sĩ', placeholder: 'Ví dụ: Luna Flux' },
  headline: { label: 'Câu giới thiệu nổi bật', placeholder: 'Ví dụ: DJ open format cho club, lounge và sự kiện thương hiệu' },
  bookingRate: { label: 'Mức giá booking tham khảo', placeholder: 'Ví dụ: 18.000.000 VND / set', helper: 'Có thể để trống nếu muốn đối tác liên hệ để nhận báo giá.' },
  availability: { label: 'Tình trạng nhận show', placeholder: 'Ví dụ: Đang nhận lịch biểu diễn, ưu tiên cuối tuần' },
  shortBio: { label: 'Giới thiệu ngắn', placeholder: 'Viết 2-3 câu về kinh nghiệm, phong cách biểu diễn, khu vực hoạt động và điểm mạnh của bạn.' },
  primaryRole: { label: 'Vai trò chính' },
  portraitUpload: { label: 'Ảnh chân dung', helper: 'Nên dùng ảnh dọc rõ mặt, tỷ lệ 3:4, tối thiểu 1200 x 1600 px.' },
  coverUpload: { label: 'Ảnh cover ngang', helper: 'Nên dùng ảnh ngang tỷ lệ 16:9, tối thiểu 1920 x 1080 px.' },
  gender: { label: 'Giới tính' },
  region: { label: 'Khu vực hoạt động' },
  city: { label: 'Tỉnh / thành phố chính' },
  genres: { label: 'Phong cách / dòng nhạc', placeholder: 'Ví dụ: House, Vinahouse, Open Format, Afro, Remix' },
  longBio: { label: 'Giới thiệu chi tiết', placeholder: 'Kể câu chuyện nghệ sĩ, định hướng hình ảnh, các dòng nhạc theo đuổi và mục tiêu nghề nghiệp.' },
  workExperience: { label: 'Kinh nghiệm làm việc', placeholder: 'Mỗi dòng ghi một kinh nghiệm: tên venue hoặc festival, vai trò, thời gian và điểm nổi bật.' },
  signatureMoments: { label: 'Điểm mạnh sân khấu', placeholder: 'Ví dụ: kiểm soát peak-time, tương tác đám đông, linh hoạt nhiều định dạng nhạc.' },
  bookingCities: { label: 'Khu vực nhận booking', placeholder: 'Ví dụ: TP.HCM, Hà Nội, Đà Nẵng, Phú Quốc.' },
  bookingNotes: { label: 'Ghi chú cho đối tác booking', placeholder: 'Ghi các lưu ý về lịch diễn, thời lượng set, di chuyển hoặc yêu cầu đặc biệt.' },
  basicRider: { label: 'Rider cơ bản', placeholder: 'Ví dụ: CDJ, mixer, booth monitor, microphone, hospitality.' },
}

const profileTemplateCopy: Record<string, { title: string; description: string }> = {
  'Mẫu bio cơ bản': {
    title: 'Thông tin hồ sơ cơ bản',
    description: 'Điền đủ tên nghệ sĩ, câu giới thiệu, giới thiệu ngắn và vai trò chính để gửi Admin duyệt hồ sơ.',
  },
  'Mẫu profile chi tiết': {
    title: 'Thông tin hồ sơ chi tiết',
    description: 'Bổ sung thông tin nghề nghiệp, kinh nghiệm và yêu cầu booking để profile của bạn thuyết phục hơn.',
  },
}

const bookingSetupTemplate: ArtistPortalTemplate = {
  title: 'Thiết lập nhận Booking',
  description: 'Hoàn thiện các thông tin này trước để đối tác gửi yêu cầu đúng nhu cầu và team của bạn phản hồi nhanh hơn.',
  fields: [
    { label: 'Khu vực nhận show', name: 'bookingRegions', type: 'textarea', placeholder: 'Ví dụ: TP.HCM, Hà Nội, Đà Nẵng, Phú Quốc...' },
    { label: 'Mức giá booking', name: 'bookingRate', type: 'text', placeholder: 'Ví dụ: 18.000.000 VND / set', optional: true, helper: 'Để trống nếu bạn muốn profile hiển thị “Liên hệ để nhận báo giá”.' },
    { label: 'Đầu mối Booking', name: 'bookingContact', type: 'text', placeholder: 'Họ tên, số điện thoại hoặc email của người phụ trách' },
    { label: 'Thời gian phản hồi', name: 'responseTime', type: 'select', options: ['Trong 2 giờ', 'Trong ngày', 'Trong 24 giờ', 'Theo lịch làm việc'] },
    { label: 'Thời gian soundcheck', name: 'soundcheck', type: 'text', placeholder: 'Ví dụ: Có mặt trước giờ diễn 90 phút để soundcheck' },
    { label: 'Rider và yêu cầu cơ bản', name: 'bookingRider', type: 'textarea', placeholder: 'Thiết bị, booth, monitor, hospitality, khách mời hoặc các yêu cầu cần lưu ý.' },
  ],
}

function text(value: string) {
  // Only repair common UTF-8-as-Latin-1 sequences. Vietnamese characters such
  // as "á" and "â" are valid on their own and must never be decoded again.
  if (!/(?:Ã.|Ä.|á[º»]|Æ.|â€)/.test(value)) return value
  try { return new TextDecoder().decode(Uint8Array.from(value, (character) => character.charCodeAt(0))) } catch { return value }
}

function templateId(sectionKey: string, title: string) {
  return `${sectionKey}:${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9:-]/g, '')}`
}

function readState() {
  if (typeof window === 'undefined') return {} as StoredPortalState
  try { return JSON.parse(window.localStorage.getItem(ARTIST_PORTAL_STORAGE_KEY) ?? '{}') as StoredPortalState } catch { return {} }
}

async function cropMusicCover(file: File) {
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

function ArtistMediaEmbedPreview({ url }: { url: string }) {
  const embed = getMediaEmbed(url)

  if (!url.trim()) return null

  if (!embed) {
    return <span className="artist-editor-field-note">Chưa nhận diện được link. Hãy dùng URL công khai của YouTube, Facebook, Instagram, SoundCloud hoặc Mixcloud.</span>
  }

  return (
    <div className={`artist-media-embed-preview artist-media-embed-${embed.provider}`}>
      <span>{embed.title} đã sẵn sàng để xem trước</span>
      <iframe src={embed.src} title={embed.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      {embed.provider === 'facebook' || embed.provider === 'instagram' ? <small>Nội dung phải công khai và cho phép nhúng từ nền tảng gốc.</small> : null}
    </div>
  )
}

export function ArtistPortalEditorPage({ section }: ArtistPortalEditorPageProps) {
  const [forms, setForms] = useState<StoredPortalState>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [profileSlug, setProfileSlug] = useState('')
  const [profileStatus, setProfileStatus] = useState<'draft' | 'pending_review' | 'published' | ''>('')
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false)
  const [activeMusicTemplate, setActiveMusicTemplate] = useState('Mẫu track đầu tiên')
  const templates = section.key === 'booking' ? [bookingSetupTemplate, ...section.templates] : section.templates
  const profileBasicsId = templateId('profile', artistPortalSections.find((item) => item.key === 'profile')?.templates[0]?.title ?? '')
  const profileBasics = forms[profileBasicsId]?.values ?? {}

  useEffect(() => {
    setForms(readState())
    try {
      const profile = JSON.parse(window.localStorage.getItem(ARTIST_PORTAL_PROFILE_KEY) ?? '{}') as { slug?: string; status?: 'draft' | 'pending_review' | 'published' }
      setProfileSlug(profile.slug ?? '')
      setProfileStatus(profile.status ?? '')
    } catch {}
  }, [])

  const updateValue = (id: string, name: string, value: string) => setForms((current) => ({
    ...current,
    [id]: { values: { ...(current[id]?.values ?? {}), [name]: value }, files: current[id]?.files ?? {} },
  }))

  const updateFile = (id: string, name: string, value: string) => setForms((current) => ({
    ...current,
    [id]: { values: current[id]?.values ?? {}, files: { ...(current[id]?.files ?? {}), [name]: value } },
  }))

  const handleFileChange = async (id: string, field: ArtistPortalField, event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    const file = selectedFiles[0]
    if (!file) return

    try {
      const value = imagePreviewFields.has(field.name) ? await cropMusicCover(file) : selectedFiles.map((selectedFile) => selectedFile.name).join(', ')
      updateFile(id, field.name, value)
      setFeedback((current) => ({ ...current, [id]: imagePreviewFields.has(field.name) ? 'Ảnh đã được crop và lưu vào bản nháp.' : `Đã chọn ${selectedFiles.length} file.` }))
    } catch (error) {
      setFeedback((current) => ({ ...current, [id]: error instanceof Error ? error.message : 'Không thể xử lý file này.' }))
    }
  }

  const save = async (id: string) => {
    window.localStorage.setItem(ARTIST_PORTAL_STORAGE_KEY, JSON.stringify(forms))
    const profileBasicsId = templateId('profile', 'Mẫu bio cơ bản')
    const profileValues = forms[profileBasicsId]?.values ?? {}
    const hasCompletedProfileBasics = Boolean(profileValues.artistName?.trim())

    if (section.key !== 'profile' || !hasCompletedProfileBasics) {
      setFeedback((current) => ({
        ...current,
        [id]: section.key === 'profile' && id === profileBasicsId
          ? 'Đã lưu. Hoàn thiện tên nghệ sĩ, headline, bio ngắn và vai trò chính để nhận thưởng +300 sao.'
          : 'Đã lưu bản nháp trên thiết bị này.',
      }))
      return
    }

    try {
      const response = await fetch('/api/portal/artist/profile', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: profileValues.artistName,
          headline: profileValues.headline,
          shortBio: profileValues.shortBio,
          primaryRole: profileValues.primaryRole,
          bookingRate: profileValues.bookingRate,
          availability: profileValues.availability,
        }),
      })
      const result = await response.json() as { ok?: boolean; awarded?: boolean; stars?: number; slug?: string; profileStatus?: 'draft' | 'pending_review' | 'published'; message?: string }
      if (!result.ok) throw new Error(result.message || 'Chưa thể xác nhận hồ sơ.')
      setProfileSlug(result.slug ?? '')
      setProfileStatus(result.profileStatus ?? '')
      window.localStorage.setItem(ARTIST_PORTAL_PROFILE_KEY, JSON.stringify({ slug: result.slug, status: result.profileStatus }))
      setFeedback((current) => ({
        ...current,
        [id]: result.profileStatus === 'draft'
          ? 'Đã lưu hồ sơ nháp vào hệ thống. Hoàn thiện câu giới thiệu, giới thiệu ngắn và vai trò chính để gửi Admin duyệt.'
          : result.awarded
            ? `Hồ sơ đã được gửi chờ duyệt và cộng +300 sao. Ví hiện có ${result.stars ?? 0} sao.`
            : 'Hồ sơ đã được cập nhật và đang chờ duyệt. Phần thưởng +300 sao chỉ áp dụng một lần.',
      }))
    } catch (error) {
      setFeedback((current) => ({ ...current, [id]: error instanceof Error ? error.message : 'Đã lưu bản nháp nhưng chưa thể xác nhận phần thưởng.' }))
    }
  }

  const toggleAlbumTrack = (id: string, fieldName: string, track: string) => {
    const selectedTracks = (forms[id]?.values[fieldName] ?? '').split(' | ').filter(Boolean)
    const nextTracks = selectedTracks.includes(track)
      ? selectedTracks.filter((item) => item !== track)
      : [...selectedTracks, track]
    updateValue(id, fieldName, nextTracks.join(' | '))
  }

  const getMusicTemplateLabel = (template: ArtistPortalTemplate) => {
    if (template.title === 'Mẫu track đầu tiên') return 'Track'
    if (template.title === 'Mẫu playlist / nonstop') return 'Nonstop / Mixset'
    return 'Album / EP'
  }

  const openPublicProfile = () => {
    const basicsId = templateId('profile', artistPortalSections.find((item) => item.key === 'profile')?.templates[0]?.title ?? '')
    if (!profileSlug) {
      setIsDraftPreviewOpen(true)
      return
    }
    if (profileStatus !== 'published') {
      setIsDraftPreviewOpen(true)
      return
    }
    window.location.assign(`/nghe-si/${profileSlug}`)
  }

  const previewValue = (fieldName: string) => {
    for (const state of Object.values(forms)) {
      const value = state.values[fieldName] ?? state.files[fieldName]
      if (value?.trim()) return value.trim()
    }
    return ''
  }

  useEffect(() => {
    if (section.key !== 'profile') return

    const interceptSampleProfileLink = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('a[href="/nghe-si/neon-viper"]')) return
      event.preventDefault()
      openPublicProfile()
    }

    document.addEventListener('click', interceptSampleProfileLink)
    return () => document.removeEventListener('click', interceptSampleProfileLink)
  }, [profileSlug, profileStatus, section.key])

  const renderTemplate = (template: ArtistPortalTemplate) => {
    const id = templateId(section.key, template.title)
    const values = forms[id]?.values ?? {}
    const files = forms[id]?.files ?? {}

    return <article key={template.title} className="artist-editor-template-card">
      <div className="artist-editor-template-head"><div><strong>{section.key === 'profile' ? (profileTemplateCopy[template.title]?.title ?? text(template.title)) : text(template.title)}</strong><p>{section.key === 'profile' ? (profileTemplateCopy[template.title]?.description ?? text(template.description)) : text(template.description)}</p></div><button type="button" className="button artist-editor-save-button" onClick={() => void save(id)}>Lưu thông tin</button></div>
      <form className="artist-editor-form-grid" onSubmit={(event) => { event.preventDefault(); void save(id) }}>
        {template.fields.map((field) => <div key={field.name} className={`field${field.type === 'textarea' || field.type === 'trackpicker' || field.type === 'file' ? ' artist-editor-field-wide' : ''}`}>
          <label htmlFor={`${id}-${field.name}`}>{section.key === 'profile' ? (profileFieldCopy[field.name]?.label ?? text(field.label)) : text(field.label)}{field.optional ? <span className="artist-editor-optional-tag">Tùy chọn</span> : null}</label>
          {field.type === 'textarea' ? <textarea id={`${id}-${field.name}`} name={field.name} placeholder={section.key === 'profile' ? (profileFieldCopy[field.name]?.placeholder ?? text(field.placeholder ?? '')) : text(field.placeholder ?? '')} value={values[field.name] ?? ''} onChange={(event) => updateValue(id, field.name, event.target.value)} /> : null}
          {field.type === 'select' ? <select id={`${id}-${field.name}`} name={field.name} value={values[field.name] ?? ''} onChange={(event) => updateValue(id, field.name, event.target.value)}><option value="" disabled>Chọn thông tin phù hợp</option>{field.options?.map((option) => <option key={option} value={option}>{text(option)}</option>)}</select> : null}
          {field.type === 'trackpicker' ? <div className="artist-album-track-picker"><div className="artist-album-track-picker-head"><span>Kho nhạc của bạn</span><strong>{(values[field.name] ?? '').split(' | ').filter(Boolean).length} track đã chọn</strong></div><div className="artist-album-track-list">{field.options?.map((option, index) => { const isSelected = (values[field.name] ?? '').split(' | ').filter(Boolean).includes(option); return <article key={option} className={isSelected ? 'is-selected' : ''}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{text(option)}</strong><small>{isSelected ? 'Đã thêm vào album' : 'Có trong kho nhạc của nghệ sĩ'}</small></div><button type="button" onClick={() => toggleAlbumTrack(id, field.name, option)} aria-label={`${isSelected ? 'Gỡ' : 'Thêm'} ${option}`}>{isSelected ? <Minus size={16} /> : <Plus size={16} />}</button></article> })}</div></div> : null}
          {field.type === 'text' ? <input id={`${id}-${field.name}`} name={field.name} placeholder={section.key === 'profile' ? (profileFieldCopy[field.name]?.placeholder ?? text(field.placeholder ?? '')) : text(field.placeholder ?? '')} value={values[field.name] ?? ''} onChange={(event) => updateValue(id, field.name, event.target.value)} /> : null}
          {field.type === 'file' ? <div className="artist-editor-upload-card">
            {imagePreviewFields.has(field.name) ? <label className="artist-editor-cover-upload" htmlFor={`${id}-${field.name}`}><img src={files[field.name] || DEFAULT_MUSIC_COVER} alt="Xem trước ảnh" /><span><strong>{files[field.name] ? 'Đổi ảnh' : 'Chọn ảnh'}</strong><small>Tự crop phù hợp khung hiển thị</small></span><input id={`${id}-${field.name}`} name={field.name} type="file" accept={field.accept} onChange={(event) => void handleFileChange(id, field, event)} /></label> : <input id={`${id}-${field.name}`} name={field.name} type="file" accept={field.accept} multiple={field.multiple} onChange={(event) => void handleFileChange(id, field, event)} />}
            {field.maxSizeMb ? <span className="artist-editor-upload-limit">File hình tối đa {field.maxSizeMb}MB</span> : null}{field.helper ? <span className="artist-editor-upload-size">{section.key === 'profile' ? (profileFieldCopy[field.name]?.helper ?? text(field.helper)) : text(field.helper)}</span> : null}{imagePreviewFields.has(field.name) && !files[field.name] ? <span className="artist-editor-upload-file">Chưa có ảnh riêng: đang dùng cover mặc định của 9life Mag.</span> : null}{files[field.name] && !imagePreviewFields.has(field.name) ? <span className="artist-editor-upload-file">Đã chọn: {files[field.name]}</span> : null}</div> : null}
          {field.type !== 'file' && field.helper ? <span className="artist-editor-field-note">{section.key === 'profile' ? (profileFieldCopy[field.name]?.helper ?? text(field.helper)) : text(field.helper)}</span> : null}
          {field.name === 'sourceUrl' || field.name === 'videoUrl' ? <ArtistMediaEmbedPreview url={values[field.name] ?? ''} /> : null}
        </div>)}
      </form>
      {feedback[id] ? <p className="artist-editor-save-feedback">{feedback[id]}</p> : null}
    </article>
  }

  return (
    <>
      {isDraftPreviewOpen ? <div className="music-visualizer-overlay" role="dialog" aria-modal="true" aria-label="Bản xem trước nội dung nghệ sĩ"><section className="music-visualizer-shell artist-dashboard-panel artist-profile-draft-preview"><button type="button" className="music-visualizer-close" onClick={() => setIsDraftPreviewOpen(false)}>Đóng</button><p className="section-eyebrow">{section.key === 'profile' ? 'Bản xem trước hồ sơ' : `Bản xem trước ${text(section.title)}`}</p><div className="artist-profile-draft-hero"><div className="artist-profile-draft-avatar">{previewValue('portraitUpload') ? <img src={previewValue('portraitUpload')} alt="" /> : <span>{(profileBasics.artistName || 'N').slice(0, 1)}</span>}</div><div><h2>{profileBasics.artistName || 'Nghệ sĩ chưa đặt tên'}</h2><strong>{section.key === 'profile' ? (profileBasics.headline || 'Chưa có câu giới thiệu nổi bật') : (previewValue('trackTitle') || previewValue('videoTitle') || previewValue('articleTitle') || 'Nội dung chưa đặt tiêu đề')}</strong><p>{section.key === 'profile' ? (profileBasics.shortBio || 'Chưa có giới thiệu ngắn. Hãy bổ sung để người xem hiểu phong cách và kinh nghiệm của bạn.') : 'Đây là bản xem nháp riêng tư trước khi nội dung được gửi Admin kiểm tra.'}</p><span className="cms-status-chip">{profileStatus === 'published' ? 'Hồ sơ đã duyệt' : 'Bản nháp riêng tư'}</span></div></div><div className="artist-dashboard-module-grid"><article className="artist-dashboard-module-card"><strong>Thông tin nghề nghiệp</strong><p>{previewValue('genres') || 'Chưa có phong cách / dòng nhạc'}</p><p>{previewValue('city') || 'Chưa có tỉnh thành hoạt động'}</p></article><article className="artist-dashboard-module-card"><strong>Booking</strong><p>{previewValue('bookingRate') || 'Chưa công khai mức giá booking'}</p><p>{previewValue('availability') || 'Chưa cập nhật tình trạng nhận show'}</p></article><article className="artist-dashboard-module-card"><strong>Kinh nghiệm</strong><p>{previewValue('workExperience') || 'Chưa thêm kinh nghiệm làm việc'}</p></article><article className="artist-dashboard-module-card"><strong>Music / media</strong><p>{previewValue('trackTitle') || previewValue('playlistName') || 'Chưa có nội dung âm nhạc'}</p><p>{previewValue('videoTitle') || 'Chưa có video hoặc media kit'}</p></article></div><article className="artist-dashboard-panel"><p className="section-eyebrow">Giới thiệu chi tiết</p><p>{previewValue('longBio') || previewValue('description') || 'Phần này sẽ hiện khi bạn bổ sung giới thiệu chi tiết.'}</p></article><p className="artist-editor-save-feedback">Các dòng “chưa có” cũng sẽ là danh sách để bạn và Admin biết cần bổ sung trước khi duyệt công khai.</p></section></div> : null}
    <main className="artist-editor-page">
      {/*
      {isDraftPreviewOpen ? <div className="music-visualizer-overlay" role="dialog" aria-modal="true" aria-label="Xem trước hồ sơ nháp"><section className="music-visualizer-shell artist-dashboard-panel"><button type="button" className="music-visualizer-close" onClick={() => setIsDraftPreviewOpen(false)}>Đóng</button><p className="section-eyebrow">Bản xem trước</p><h2>{forms[templateId('profile', artistPortalSections.find((item) => item.key === 'profile')?.templates[0]?.title ?? '')]?.values.artistName || 'Hồ sơ nghệ sĩ'}</h2><p>{forms[templateId('profile', artistPortalSections.find((item) => item.key === 'profile')?.templates[0]?.values.shortBio || '']}</p><p className="artist-editor-save-feedback">Bản này chỉ bạn xem được. Admin cần duyệt trước khi hồ sơ xuất hiện công khai.</p></section></div> : null}
      */}
      <section className="artist-dashboard-hero artist-editor-hero">
        <div className="container artist-editor-hero-row">
          <div className="artist-editor-copy">
            <p className="section-eyebrow">{text(section.eyebrow)}</p>
            <h1>{text(section.title)}</h1>
            <p className="section-intro">{text(section.intro)}</p>
          </div>
          <div className="artist-dashboard-hero-actions">
            <button type="button" onClick={() => section.key === 'profile' ? openPublicProfile() : setIsDraftPreviewOpen(true)} className="button-secondary">{section.key === 'profile' && profileStatus === 'published' ? text(section.publicLabel) : 'Xem bản nháp'}</button>
            <a href="#artist-editor-form" className="button">Đi tới form</a>
          </div>
        </div>
        <div className="container artist-editor-tabs">
          <Link href="/tai-khoan/nghe-si/dashboard" className="artist-editor-tab">
            Dashboard
          </Link>
          {artistPortalSections.map((item) => <Link key={item.key} href={`/tai-khoan/nghe-si/dashboard/${item.key}`} className={`artist-editor-tab${item.key === section.key ? ' artist-editor-tab-active' : ''}`}>{text(item.tabLabel)}</Link>)}
        </div>
        <div className="container artist-dashboard-stats">
          {section.heroMetrics.map((item) => <article key={item.label} className="artist-dashboard-stat"><strong>{text(item.value)}</strong><span>{text(item.label)}</span></article>)}
        </div>
      </section>

      <section className="section">
        <div className="container artist-editor-shell">
          <div className="artist-editor-main">
            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div><p className="section-eyebrow">Trạng thái</p><h2>{section.key === 'booking' ? 'Booking đã sẵn sàng đến đâu?' : 'Trạng thái nội dung hiện tại'}</h2><p className="artist-editor-panel-note">Các mục này giúp bạn biết phần nào cần hoàn thiện tiếp theo.</p></div>
                <div className="artist-editor-panel-actions"><a href="#artist-editor-form" className="button-secondary">Đi tới form</a><button type="button" className="button-secondary" onClick={() => section.key === 'profile' ? openPublicProfile() : setIsDraftPreviewOpen(true)}>{section.key === 'profile' && profileStatus === 'published' ? 'Xem công khai' : 'Xem bản nháp'}</button></div>
              </div>
              <div className="artist-editor-workflow">
                {section.workflow.map((item) => <article key={item.title} className="artist-editor-workflow-card"><div className="artist-editor-status-row"><strong>{text(item.title)}</strong><span className="artist-editor-status-pill">{text(item.status)}</span></div><p>{text(item.detail)}</p></article>)}
              </div>
            </article>

            <article className="artist-dashboard-panel" id="artist-editor-form">
              <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Biểu mẫu</p><h2>{section.key === 'booking' ? 'Thông tin Booking' : 'Biểu mẫu cho nghệ sĩ mới'}</h2></div><span className="artist-editor-static-note">Điền xong từng khối rồi bấm lưu bản nháp.</span></div>
              <div className="artist-editor-template-stack">
                {section.key === 'music' ? <div className="artist-music-template-tabs"><div className="artist-music-template-tab-list" role="tablist" aria-label="Loại nội dung âm nhạc">{templates.map((template) => <button key={template.title} type="button" role="tab" aria-selected={activeMusicTemplate === template.title} className={activeMusicTemplate === template.title ? 'is-active' : ''} onClick={() => setActiveMusicTemplate(template.title)}>{getMusicTemplateLabel(template)}</button>)}</div>{templates.filter((template) => template.title === activeMusicTemplate).map(renderTemplate)}</div> : templates.map(renderTemplate)}
              </div>
            </article>
          </div>

          <aside className="artist-editor-side">
            {section.key === 'profile' ? <StudentRegistrationSettings /> : null}
            {section.key === 'profile' ? <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Huong dan dien ho so</p><h2>De Admin duyet nhanh</h2></div></div><div className="artist-dashboard-update-list"><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>Ten nghe si:</strong> dung nghe danh muon hien thi tren poster, booking va trang tim kiem.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>Headline:</strong> viet mot cau ngan ve vai tro va phong cach, vi du: DJ open format cho club, lounge va su kien thuong hieu.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>Bio ngan:</strong> viet 2-3 cau ve kinh nghiem, dong nhac, khu vuc hoat dong va diem manh khi bieu dien.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>Vai tro chinh:</strong> chon dung de CMS phan loai va Admin duyet profile chinh xac.</p></div></div></article> : null}
            <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Bắt đầu</p><h2>Checklist cho lần đăng ký đầu</h2></div></div><div className="artist-dashboard-update-list">{section.starterChecklist.map((item) => <div key={item} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>{text(item)}</p></div>)}</div></article>
            <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Điều hướng</p><h2>Quản lý nhanh</h2></div></div><div className="artist-dashboard-quick-links"><Link href="/tai-khoan/nghe-si/dashboard" className="artist-dashboard-quick-link">Về dashboard nghệ sĩ</Link><Link href="/tai-khoan/nghe-si/dashboard/profile" className="artist-dashboard-quick-link">Hồ sơ nghệ sĩ</Link><Link href="/tai-khoan/nghe-si/dashboard/music" className="artist-dashboard-quick-link">Link nhạc và playlist</Link><Link href="/tai-khoan/nghe-si/dashboard/booking" className="artist-dashboard-quick-link">Booking và rider</Link></div></article>
          </aside>
        </div>
      </section>
    </main>
    </>
  )
}
