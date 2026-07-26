'use client'

import Image from 'next/image'
import { useMemo, useState, type ChangeEvent } from 'react'

import { useCmsCapability } from '@/components/cms-capability-provider'
import { getMediaEmbed } from '@/lib/media-embed'
import { getVietnamRegionLabel, vietnamLocationNames } from '@/lib/vietnam-locations'

type OutletStatus = 'draft' | 'pending_review' | 'published' | 'cancelled'

export type OutletMedia = {
  id: string
  url: string
  alt: string
}

export type OutletEditorInitial = {
  id?: string
  name?: string
  status?: OutletStatus
  type?: string
  region?: string
  city?: string
  hours?: string
  crowd?: string
  vibe?: string
  summary?: string
  introduction?: string
  highlights?: string
  tableOptions?: string
  serviceNotes?: string
  musicStyles?: string
  faq?: string
  videoEmbed?: string
  audioEmbed?: string
  bookingChannel?: string
  coverImage?: OutletMedia | null
  portraitImage?: OutletMedia | null
  gallery?: OutletMedia[]
}

type OutletForm = Omit<OutletEditorInitial, 'id' | 'coverImage' | 'portraitImage' | 'gallery'> & {
  id?: string
  coverImage: OutletMedia | null
  portraitImage: OutletMedia | null
  gallery: OutletMedia[]
}

type OutletFaqItem = { question: string; answer: string }

function parseFaq(value?: string): OutletFaqItem[] {
  const lines = (value ?? '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  const pairs: OutletFaqItem[] = []
  for (let index = 0; index < lines.length; index += 2) {
    pairs.push({ question: lines[index], answer: lines[index + 1] ?? '' })
  }
  return pairs.length ? pairs : [{ question: '', answer: '' }]
}

function serializeFaq(items: OutletFaqItem[]) {
  return items
    .filter((item) => item.question.trim() || item.answer.trim())
    .flatMap((item) => [item.question.trim(), item.answer.trim()])
    .join('\n')
}

const statusLabels: Record<OutletStatus, string> = {
  draft: 'Bản nháp',
  pending_review: 'Chờ duyệt',
  published: 'Đã duyệt',
  cancelled: 'Huỷ',
}

function createForm(initial?: OutletEditorInitial): OutletForm {
  return {
    id: initial?.id,
    name: initial?.name ?? '',
    status: initial?.status ?? 'draft',
    type: initial?.type ?? '',
    region: initial?.region ?? '',
    city: initial?.city ?? '',
    hours: initial?.hours ?? '',
    crowd: initial?.crowd ?? '',
    vibe: initial?.vibe ?? '',
    summary: initial?.summary ?? '',
    introduction: initial?.introduction ?? '',
    highlights: initial?.highlights ?? '',
    tableOptions: initial?.tableOptions ?? '',
    serviceNotes: initial?.serviceNotes ?? '',
    musicStyles: initial?.musicStyles ?? '',
    faq: initial?.faq ?? '',
    videoEmbed: initial?.videoEmbed ?? '',
    audioEmbed: initial?.audioEmbed ?? '',
    bookingChannel: initial?.bookingChannel ?? '',
    coverImage: initial?.coverImage ?? null,
    portraitImage: initial?.portraitImage ?? null,
    gallery: initial?.gallery ?? [],
  }
}

function OutletEmbedPreview({ value, label }: { value: string; label: string }) {
  const embed = getMediaEmbed(value)
  if (!value.trim()) return null
  if (!embed) return <p className="artist-editor-save-feedback">{label} chưa phải link được hỗ trợ. Dùng YouTube, Facebook, Instagram, SoundCloud hoặc Mixcloud.</p>

  return (
    <div className={`artist-media-embed-preview artist-media-embed-${embed.provider}`}>
      <span>Xem trước {label}: {embed.provider}</span>
      <iframe title={embed.title} src={embed.src} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  )
}

export function CmsOutletProfileBuilder({ initial }: { initial?: OutletEditorInitial }) {
  const capability = useCmsCapability('booking')
  const [draft, setDraft] = useState<OutletForm>(() => createForm(initial))
  const [feedback, setFeedback] = useState(initial?.id ? 'Bản nháp này đang được lưu trong CMS.' : 'Chưa lưu bản nháp outlet mới.')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [faqItems, setFaqItems] = useState<OutletFaqItem[]>(() => parseFaq(initial?.faq))
  const [previewOpen, setPreviewOpen] = useState(false)

  const updateField = <K extends keyof OutletForm>(key: K, value: OutletForm[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setFeedback('Có thay đổi chưa lưu.')
  }

  const updateFaqItem = (index: number, key: keyof OutletFaqItem, value: string) => {
    setFaqItems((current) => {
      const next = current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
      updateField('faq', serializeFaq(next))
      return next
    })
  }

  const preview = useMemo(() => ({
    name: draft.name || 'Tên outlet sẽ hiển thị ở đây',
    type: draft.type || 'Club / Lounge / Rooftop',
    city: draft.city || 'Địa phương',
    region: draft.region || 'Miền / khu vực',
    summary: draft.summary || 'Mô tả ngắn sẽ xuất hiện trên profile public để user hiểu nhanh trải nghiệm của venue.',
    vibe: draft.vibe || 'Nightlife / table service / music identity',
  }), [draft])

  const uploadImage = async (file: File, alt: string) => {
    const formData = new FormData()
    formData.set('file', file)
    formData.set('alt', alt)
    const response = await fetch('/api/cms/outlets/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: capability ? { Authorization: `Bearer ${capability}` } : undefined,
    })
    const result = await response.json().catch(() => ({})) as { ok?: boolean; message?: string; media?: OutletMedia }
    if (!response.ok || !result.ok || !result.media) throw new Error(result.message || 'Không thể upload ảnh lúc này.')
    return result.media
  }

  const handleSingleImage = async (kind: 'coverImage' | 'portraitImage', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(kind)
    setFeedback(`Đang upload ${kind === 'coverImage' ? 'cover' : 'ảnh đại diện'}...`)
    try {
      const media = await uploadImage(file, `${draft.name || 'Outlet'} ${kind === 'coverImage' ? 'cover' : 'portrait'}`)
      updateField(kind, media)
      setFeedback('Ảnh đã upload. Nhấn Lưu bản nháp để gắn ảnh vào outlet.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể upload ảnh.')
    } finally {
      setUploading(null)
    }
  }

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    setUploading('gallery')
    setFeedback(`Đang upload ${files.length} ảnh gallery...`)
    try {
      const media = await Promise.all(files.map((file) => uploadImage(file, `${draft.name || 'Outlet'} gallery`)))
      updateField('gallery', [...draft.gallery, ...media].slice(0, 20))
      setFeedback(`Đã upload ${media.length} ảnh gallery. Nhấn Lưu bản nháp để cập nhật.`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể upload gallery.')
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async (nextStatus?: OutletStatus) => {
    if ((draft.name ?? '').trim().length < 2) {
      setFeedback('Hãy nhập tên outlet trước khi lưu.')
      return
    }
    const status = nextStatus ?? draft.status ?? 'draft'
    setSaving(true)
    setFeedback('Đang lưu bản nháp vào CMS...')
    try {
      const response = await fetch('/api/cms/outlets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({
          ...draft,
          status,
          coverImage: draft.coverImage ? Number(draft.coverImage.id) : null,
          portraitImage: draft.portraitImage ? Number(draft.portraitImage.id) : null,
          gallery: draft.gallery.map((media) => Number(media.id)),
        }),
      })
      const result = await response.json().catch(() => ({})) as { ok?: boolean; message?: string; outlet?: { id: number } }
      if (!response.ok || !result.ok || !result.outlet) throw new Error(result.message || 'Không thể lưu outlet.')
      setDraft((current) => ({ ...current, id: String(result.outlet!.id), status }))
      setFeedback(`Đã lưu ${statusLabels[status].toLowerCase()} vào CMS.`)
      // Keep the working CMS page alive after saving. A full route refresh can
      // drop a proxy-issued CMS cookie while the draft itself has already saved.
      window.history.replaceState(null, '', `/cms/dashboard/outlets/new?id=${result.outlet.id}`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể lưu outlet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="artist-editor-shell cms-outlet-editor-shell">
      <div className="artist-editor-main">
        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Venue Identity</p><h2>Thông tin cốt lõi của outlet</h2><p className="artist-editor-panel-note">Bản nháp được lưu vào CMS thật, có thể mở lại và tiếp tục chỉnh sửa ở bất kỳ máy nào.</p></div><button type="button" className="button-secondary" onClick={() => setPreviewOpen(true)}>Xem bản nháp</button></div>
          <div className="artist-editor-form-grid">
            <div className="field"><label htmlFor="outletName">Tên outlet</label><input id="outletName" value={draft.name} placeholder="Velvet District" onChange={(event) => updateField('name', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletStatus">Trạng thái</label><select id="outletStatus" value={draft.status} onChange={(event) => updateField('status', event.target.value as OutletStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="field"><label htmlFor="outletType">Định vị</label><input id="outletType" value={draft.type} placeholder="Club / VIP Table / Rooftop" onChange={(event) => updateField('type', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletCity">Địa phương</label><select id="outletCity" value={draft.city} onChange={(event) => { updateField('city', event.target.value); updateField('region', getVietnamRegionLabel(event.target.value)) }}><option value="">Chọn tỉnh / thành phố</option>{vietnamLocationNames.map((city) => <option key={city}>{city}</option>)}</select></div>
            <div className="field"><label htmlFor="outletRegion">Miền / khu vực</label><input id="outletRegion" value={draft.region} readOnly placeholder="Tự cập nhật theo địa phương" /></div>
            <div className="field"><label htmlFor="outletHours">Giờ hoạt động</label><input id="outletHours" value={draft.hours} placeholder="21:00 - 03:00" onChange={(event) => updateField('hours', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletCrowd">Quy mô bàn / nhóm</label><input id="outletCrowd" value={draft.crowd} placeholder="6-12 khách / bàn" onChange={(event) => updateField('crowd', event.target.value)} /></div>
            <div className="field artist-editor-field-wide"><label htmlFor="outletVibe">Vibe chính</label><input id="outletVibe" value={draft.vibe} placeholder="Premium nightlife / VIP table / headline DJ" onChange={(event) => updateField('vibe', event.target.value)} /></div>
            <div className="field artist-editor-field-wide"><label htmlFor="outletSummary">Mô tả ngắn ở đầu profile</label><textarea id="outletSummary" value={draft.summary} placeholder="Viết 2-3 câu ngắn về trải nghiệm venue..." onChange={(event) => updateField('summary', event.target.value)} /></div>
          </div>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Venue Story</p><h2>Nội dung chi tiết</h2></div></div>
          <div className="artist-editor-form-grid">
            <div className="field artist-editor-field-wide"><label htmlFor="outletIntro">Venue story / giới thiệu outlet</label><textarea id="outletIntro" value={draft.introduction} onChange={(event) => updateField('introduction', event.target.value)} /></div>
            <div className="field artist-editor-field-wide"><label htmlFor="outletHighlights">Điểm mạnh nightlife</label><textarea id="outletHighlights" value={draft.highlights} onChange={(event) => updateField('highlights', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletTables">Loại bàn và package</label><textarea id="outletTables" value={draft.tableOptions} onChange={(event) => updateField('tableOptions', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletServices">Lưu ý dịch vụ</label><textarea id="outletServices" value={draft.serviceNotes} onChange={(event) => updateField('serviceNotes', event.target.value)} /></div>
            <div className="field"><label htmlFor="outletMusic">Dòng nhạc / music mood</label><textarea id="outletMusic" value={draft.musicStyles} onChange={(event) => updateField('musicStyles', event.target.value)} /></div>
            <div className="field artist-editor-field-wide"><label>FAQ</label><div className="cms-outlet-faq-editor">{faqItems.map((item, index) => <div className="cms-outlet-faq-pair" key={index}><strong>FAQ {index + 1}</strong><input value={item.question} placeholder="Câu hỏi, ví dụ: Có cần đặt bàn trước không?" onChange={(event) => updateFaqItem(index, 'question', event.target.value)} /><textarea value={item.answer} placeholder="Câu trả lời rõ ràng cho khách" onChange={(event) => updateFaqItem(index, 'answer', event.target.value)} /><button type="button" className="button-secondary" disabled={faqItems.length === 1} onClick={() => { const next = faqItems.filter((_, itemIndex) => itemIndex !== index); setFaqItems(next); updateField('faq', serializeFaq(next)) }}>Xoá câu này</button></div>)}<button type="button" className="button-secondary" onClick={() => setFaqItems((current) => [...current, { question: '', answer: '' }])}>+ Thêm câu hỏi</button></div></div>
          </div>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Media Upload</p><h2>Hình ảnh, video và link nhạc</h2><p className="artist-editor-panel-note">Ảnh upload được lưu vào Media/R2 ngay, sau đó nhấn Lưu bản nháp để liên kết với outlet.</p></div></div>
          <div className="artist-editor-form-grid">
            <div className="field artist-editor-field-wide"><label htmlFor="outletCoverUpload">Ảnh cover outlet</label><div className="artist-editor-upload-card"><input id="outletCoverUpload" type="file" accept="image/*" disabled={uploading !== null} onChange={(event) => void handleSingleImage('coverImage', event)} />{draft.coverImage ? <Image src={draft.coverImage.url} alt={draft.coverImage.alt} width={960} height={540} className="cms-outlet-media-preview" /> : <span className="artist-editor-upload-size">Khuyến nghị 1600 x 900px hoặc lớn hơn.</span>}</div></div>
            <div className="field"><label htmlFor="outletPortraitUpload">Ảnh đại diện</label><div className="artist-editor-upload-card"><input id="outletPortraitUpload" type="file" accept="image/*" disabled={uploading !== null} onChange={(event) => void handleSingleImage('portraitImage', event)} />{draft.portraitImage ? <Image src={draft.portraitImage.url} alt={draft.portraitImage.alt} width={600} height={760} className="cms-outlet-media-preview cms-outlet-media-preview-portrait" /> : <span className="artist-editor-upload-size">Khuyến nghị 900 x 1200px.</span>}</div></div>
            <div className="field"><label htmlFor="outletGalleryUpload">Gallery venue</label><div className="artist-editor-upload-card"><input id="outletGalleryUpload" type="file" accept="image/*" multiple disabled={uploading !== null || draft.gallery.length >= 20} onChange={(event) => void handleGalleryUpload(event)} /><span className="artist-editor-upload-size">Thêm ảnh nhiều lần, tối đa 20 ảnh.</span><div className="cms-outlet-gallery-list">{draft.gallery.map((media) => <figure key={media.id} className="cms-outlet-gallery-item"><Image src={media.url} alt={media.alt} width={280} height={210} /><button type="button" onClick={() => updateField('gallery', draft.gallery.filter((item) => item.id !== media.id))}>Xoá</button></figure>)}</div></div></div>
            <div className="field artist-editor-field-wide"><label htmlFor="outletVideoEmbed">Link video / embed</label><textarea id="outletVideoEmbed" value={draft.videoEmbed ?? ''} placeholder="Dán link YouTube, Facebook video/reel hoặc Instagram" onChange={(event) => updateField('videoEmbed', event.target.value)} /><OutletEmbedPreview label="video" value={draft.videoEmbed ?? ''} /></div>
            <div className="field artist-editor-field-wide"><label htmlFor="outletAudioEmbed">Link nhạc / audio embed</label><textarea id="outletAudioEmbed" value={draft.audioEmbed ?? ''} placeholder="Dán link SoundCloud hoặc Mixcloud của outlet" onChange={(event) => updateField('audioEmbed', event.target.value)} /><OutletEmbedPreview label="nhạc" value={draft.audioEmbed ?? ''} /></div>
          </div>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Booking Config</p><h2>Cấu hình booking</h2></div></div>
          <div className="artist-editor-form-grid"><div className="field artist-editor-field-wide"><label htmlFor="outletBookingChannel">Channel Telegram riêng</label><input id="outletBookingChannel" value={draft.bookingChannel} placeholder="@booking_new_outlet" onChange={(event) => updateField('bookingChannel', event.target.value)} /></div></div>
          <div className="cms-inline-actions cms-outlet-review-actions">
            <button type="button" className="button-secondary" disabled={saving} onClick={() => void handleSave('draft')}>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</button>
            <button type="button" className="button" disabled={saving} onClick={() => void handleSave('pending_review')}>Gửi chờ duyệt</button>
            <button type="button" className="button-secondary" disabled={saving} onClick={() => void handleSave('published')}>Duyệt public</button>
            <button type="button" className="button-secondary" disabled={saving} onClick={() => void handleSave('cancelled')}>Huỷ hồ sơ</button>
          </div>
          <p className="artist-editor-save-feedback">{feedback}</p>
        </article>
      </div>

      <aside className={`artist-editor-side ${previewOpen ? 'cms-outlet-preview-open' : 'cms-outlet-preview-hidden'}`}>
        <button type="button" className="button-secondary cms-outlet-preview-close" onClick={() => setPreviewOpen(false)}>Đóng bản nháp</button>
        <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Preview Draft</p><h2>Xem trước profile outlet</h2><p className="artist-editor-panel-note">Bản xem trước hiển thị toàn bộ nội dung đã nhập để kiểm tra trước khi duyệt public.</p></div></div><div className="artist-profile-preview-card">{draft.coverImage ? <Image src={draft.coverImage.url} alt={draft.coverImage.alt} width={960} height={540} className="cms-outlet-preview-cover" /> : <div className="artist-profile-preview-cover"><span>{preview.vibe}</span></div>}<div className="artist-profile-preview-body">{draft.portraitImage ? <Image src={draft.portraitImage.url} alt={draft.portraitImage.alt} width={160} height={160} className="cms-outlet-preview-avatar" /> : null}<strong>{preview.name}</strong><div className="tag-row"><span className="pill">{preview.city}</span><span className="pill">{preview.type}</span><span className="pill">{preview.region}</span></div><p className="artist-profile-preview-copy">{preview.summary}</p><div className="artist-profile-preview-list"><span>Giờ hoạt động: {draft.hours || 'Chưa cập nhật'}</span><span>Quy mô bàn: {draft.crowd || 'Chưa cập nhật'}</span><span>Trạng thái: {statusLabels[draft.status ?? 'draft']}</span></div></div></div><div className="cms-outlet-preview-details"><section><h3>Giới thiệu</h3><p>{draft.introduction || 'Chưa có nội dung giới thiệu outlet.'}</p></section><section><h3>Điểm mạnh nightlife</h3><p>{draft.highlights || 'Chưa cập nhật điểm mạnh.'}</p></section><section><h3>Bàn và dịch vụ</h3><p>{draft.tableOptions || 'Chưa cập nhật loại bàn / package.'}</p><p>{draft.serviceNotes || 'Chưa có lưu ý dịch vụ.'}</p></section><section><h3>Music mood</h3><p>{draft.musicStyles || 'Chưa cập nhật dòng nhạc.'}</p></section>{draft.gallery.length ? <section className="cms-outlet-preview-gallery"><h3>Gallery</h3><div>{draft.gallery.map((media) => <Image key={media.id} src={media.url} alt={media.alt} width={180} height={132} />)}</div></section> : null}</div></article>
      </aside>
    </div>
  )
}
