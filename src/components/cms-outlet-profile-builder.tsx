'use client'

import { useEffect, useMemo, useState } from 'react'
import { cmsTelegramBookingConfig } from '@/lib/cms-dashboard-data'
import { getVietnamRegionLabel, vietnamLocationNames } from '@/lib/vietnam-locations'

type OutletDraftState = Record<string, string>

const OUTLET_DRAFT_STORAGE_KEY = 'nine-life-cms-outlet-profile-draft-v1'

function readStoredOutletDraft() {
  if (typeof window === 'undefined') return {} as OutletDraftState

  try {
    return JSON.parse(window.localStorage.getItem(OUTLET_DRAFT_STORAGE_KEY) ?? '{}') as OutletDraftState
  } catch {
    return {}
  }
}

function saveStoredOutletDraft(nextState: OutletDraftState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(OUTLET_DRAFT_STORAGE_KEY, JSON.stringify(nextState))
}

export function CmsOutletProfileBuilder() {
  const [draft, setDraft] = useState<OutletDraftState>({})
  const [feedback, setFeedback] = useState('Chưa lưu bản nháp outlet mới.')

  useEffect(() => {
    setDraft(readStoredOutletDraft())
  }, [])

  const updateField = (key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSaveDraft = () => {
    saveStoredOutletDraft(draft)
    setFeedback('Đã lưu bản nháp outlet. Có thể tiếp tục chỉnh sửa hoặc chuyển cho đội duyệt nội dung.')
  }

  const preview = useMemo(
    () => ({
      name: draft.name || 'Tên outlet sẽ hiện ở đây',
      city: draft.city || 'Địa phương',
      region: draft.region || 'Miền / khu vực',
      type: draft.type || 'Club / Lounge / Rooftop',
      vibe: draft.vibe || 'Vibe nightlife / table service / music identity',
      summary:
        draft.summary ||
        'Đây là phần mô tả ngắn xuất hiện ở hero profile ngoài site chính, giúp user hiểu ngay venue phù hợp kiểu trải nghiệm nào.',
      hours: draft.hours || '21:00 - 03:00',
      crowd: draft.crowd || '4-10 khách / bàn',
      tableOptions: draft.tableOptions || 'VIP booth, sofa table, birthday package...',
      serviceNotes: draft.serviceNotes || 'Bottle service, ưu tiên giữ bàn, birthday decor...',
      musicStyles: draft.musicStyles || 'House, open format, afro, hip-hop, peak-time...',
      gallery: draft.gallery || 'Thêm link ảnh gallery hoặc mô tả các góc chính trong venue.',
      faq: draft.faq || 'Câu hỏi thường gặp: giữ bàn, cọc, số khách, giờ nhận bàn...',
      coverUpload: draft.coverUpload || 'Chưa chọn cover venue',
      portraitUpload: draft.portraitUpload || 'Chưa chọn ảnh đại diện venue',
      galleryUpload: draft.galleryUpload || 'Chưa chọn album gallery',
      videoEmbed: draft.videoEmbed || 'Chưa gắn link YouTube / Facebook video / reel teaser',
      bookingChannel: draft.bookingChannel || '@booking_new_outlet',
    }),
    [draft],
  )

  return (
    <div className="artist-editor-shell">
      <div className="artist-editor-main">
        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Venue Identity</p>
              <h2>Thông tin cốt lõi của outlet</h2>
              <p className="artist-editor-panel-note">
                Nhóm thông tin này tạo nên hero, overview và phần nhận diện chính trên profile public.
              </p>
            </div>
          </div>

          <form className="artist-editor-form-grid">
            <div className="field">
              <label htmlFor="outletName">Tên outlet</label>
              <input id="outletName" value={draft.name ?? ''} placeholder="Velvet District" onChange={(event) => updateField('name', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="outletType">Định vị</label>
              <input id="outletType" value={draft.type ?? ''} placeholder="Club / VIP Table / Rooftop..." onChange={(event) => updateField('type', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="outletRegion">Miền / khu vực</label>
              <select id="outletRegion" value={draft.region ?? ''} onChange={(event) => updateField('region', event.target.value)}>
                <option value="" disabled>
                  Chọn khu vực
                </option>
                <option>Miền Nam</option>
                <option>Miền Trung</option>
                <option>Miền Bắc</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="outletCity">Địa phương</label>
              <select
                id="outletCity"
                value={draft.city ?? ''}
                onChange={(event) => {
                  const city = event.target.value
                  updateField('city', city)
                  updateField('region', getVietnamRegionLabel(city))
                }}
              >
                <option value="">Chọn tỉnh / thành phố</option>
                {vietnamLocationNames.map((city) => <option key={city}>{city}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="outletHours">Giờ hoạt động</label>
              <input id="outletHours" value={draft.hours ?? ''} placeholder="21:00 - 03:00" onChange={(event) => updateField('hours', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="outletCrowd">Quy mô bàn / nhóm</label>
              <input id="outletCrowd" value={draft.crowd ?? ''} placeholder="6-12 khách / bàn" onChange={(event) => updateField('crowd', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletVibe">Vibe chính</label>
              <input id="outletVibe" value={draft.vibe ?? ''} placeholder="Premium nightlife / VIP table / headline DJ..." onChange={(event) => updateField('vibe', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletSummary">Mô tả ngắn ở đầu profile</label>
              <textarea id="outletSummary" value={draft.summary ?? ''} placeholder="Viết 2-3 câu ngắn giúp user hiểu nhanh trải nghiệm chính của venue..." onChange={(event) => updateField('summary', event.target.value)} />
            </div>
          </form>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Venue Story</p>
              <h2>Nội dung chi tiết như profile ngoài site</h2>
              <p className="artist-editor-panel-note">
                Điền đủ các block để profile outlet ngoài site nhìn chuyên nghiệp, có chiều sâu và dễ chốt booking.
              </p>
            </div>
          </div>

          <form className="artist-editor-form-grid">
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletIntro">Venue story / giới thiệu outlet</label>
              <textarea id="outletIntro" value={draft.introduction ?? ''} placeholder="Mô tả concept venue, trải nghiệm trong đêm, khách phù hợp, lý do nên đặt bàn..." onChange={(event) => updateField('introduction', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletHighlights">Điểm mạnh nightlife</label>
              <textarea id="outletHighlights" value={draft.highlights ?? ''} placeholder="Mỗi dòng một điểm mạnh: line-up mạnh, khu bàn đẹp, sinh nhật, rooftop view..." onChange={(event) => updateField('highlights', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletTables">Loại bàn và package</label>
              <textarea id="outletTables" value={draft.tableOptions ?? ''} placeholder="VIP booth, standing table, sofa zone, birthday package..." onChange={(event) => updateField('tableOptions', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletServices">Lưu ý dịch vụ</label>
              <textarea id="outletServices" value={draft.serviceNotes ?? ''} placeholder="Các note về cọc bàn, giữ chỗ, giờ vào, dresscode, minimum spend..." onChange={(event) => updateField('serviceNotes', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletMusic">Music mood / dòng nhạc</label>
              <textarea id="outletMusic" value={draft.musicStyles ?? ''} placeholder="House, open format, afro, hip-hop, female DJ night..." onChange={(event) => updateField('musicStyles', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletGallery">Gallery / media venue</label>
              <textarea id="outletGallery" value={draft.gallery ?? ''} placeholder="Ghi các góc ảnh cần có: mặt tiền, khu bàn, dancefloor, rooftop, private zone..." onChange={(event) => updateField('gallery', event.target.value)} />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletFaq">FAQ / câu hỏi thường gặp</label>
              <textarea id="outletFaq" value={draft.faq ?? ''} placeholder="Ví dụ: Có cần cọc không? Giữ bàn được bao lâu? Nhận bàn từ mấy giờ?..." onChange={(event) => updateField('faq', event.target.value)} />
            </div>
          </form>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Media Upload</p>
              <h2>Hình ảnh và video cho profile outlet</h2>
              <p className="artist-editor-panel-note">
                Bổ sung cover, ảnh đại diện, gallery và video embed để profile trong CMS đầy đủ như trang public.
              </p>
            </div>
          </div>

          <form className="artist-editor-form-grid">
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletCoverUpload">Ảnh cover outlet</label>
              <div className="artist-editor-upload-card">
                <input
                  id="outletCoverUpload"
                  name="outletCoverUpload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateField('coverUpload', event.target.files?.[0]?.name ?? '')}
                />
                <span className="artist-editor-upload-size">Khuyến nghị 1600 x 900px hoặc lớn hơn.</span>
                {draft.coverUpload ? <span className="artist-editor-upload-file">Đã chọn: {draft.coverUpload}</span> : null}
              </div>
            </div>
            <div className="field">
              <label htmlFor="outletPortraitUpload">Ảnh đại diện / hero phụ</label>
              <div className="artist-editor-upload-card">
                <input
                  id="outletPortraitUpload"
                  name="outletPortraitUpload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateField('portraitUpload', event.target.files?.[0]?.name ?? '')}
                />
                <span className="artist-editor-upload-size">Khuyến nghị 900 x 1200px để dùng cho card và profile dọc.</span>
                {draft.portraitUpload ? <span className="artist-editor-upload-file">Đã chọn: {draft.portraitUpload}</span> : null}
              </div>
            </div>
            <div className="field">
              <label htmlFor="outletGalleryUpload">Album gallery venue</label>
              <div className="artist-editor-upload-card">
                <input
                  id="outletGalleryUpload"
                  name="outletGalleryUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) =>
                    updateField('galleryUpload', event.target.files?.length ? `${event.target.files.length} ảnh gallery` : '')
                  }
                />
                <span className="artist-editor-upload-size">Có thể chọn nhiều ảnh cho mặt tiền, bàn VIP, dancefloor, sân khấu, rooftop.</span>
                {draft.galleryUpload ? <span className="artist-editor-upload-file">Đã chọn: {draft.galleryUpload}</span> : null}
              </div>
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletVideoEmbed">Link video / embed</label>
              <textarea
                id="outletVideoEmbed"
                value={draft.videoEmbed ?? ''}
                placeholder="Dán link YouTube, Facebook video/reel hoặc mã embed để giới thiệu venue..."
                onChange={(event) => updateField('videoEmbed', event.target.value)}
              />
            </div>
          </form>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Booking Config</p>
              <h2>Cấu hình booking và Telegram riêng</h2>
            </div>
          </div>

          <form className="artist-editor-form-grid">
            <div className="field">
              <label htmlFor="outletBookingChannel">Channel Telegram riêng</label>
              <input id="outletBookingChannel" value={draft.bookingChannel ?? ''} placeholder="@booking_new_outlet" onChange={(event) => updateField('bookingChannel', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="outletBookingGlobalChannel">Channel tổng quản lý booking</label>
              <input id="outletBookingGlobalChannel" defaultValue={cmsTelegramBookingConfig.globalChannel} placeholder="@9lifemag_booking_ops" />
            </div>
            <div className="field artist-editor-field-wide">
              <label htmlFor="outletBookingToken">Telegram bot token mặc định</label>
              <input id="outletBookingToken" type="password" defaultValue={cmsTelegramBookingConfig.tokenDefault} />
            </div>
          </form>

          <div className="cms-inline-actions">
            <button type="button" className="button" onClick={handleSaveDraft}>
              Lưu bản nháp outlet
            </button>
          </div>
          <p className="artist-editor-save-feedback">{feedback}</p>
        </article>
      </div>

      <aside className="artist-editor-side">
        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Preview Draft</p>
              <h2>Xem trước profile outlet</h2>
            </div>
          </div>

          <div className="artist-profile-preview-card">
            <div className="artist-profile-preview-cover">
              <span>{preview.vibe}</span>
            </div>
            <div className="artist-profile-preview-body">
              <strong>{preview.name}</strong>
              <div className="tag-row">
                <span className="pill">{preview.city}</span>
                <span className="pill">{preview.type}</span>
                <span className="pill">{preview.region}</span>
              </div>
              <p className="artist-profile-preview-copy">{preview.summary}</p>
              <div className="artist-profile-preview-list">
                <span>Giờ hoạt động: {preview.hours}</span>
                <span>Quy mô bàn: {preview.crowd}</span>
                <span>Cover: {preview.coverUpload}</span>
                <span>Ảnh đại diện: {preview.portraitUpload}</span>
                <span>Gallery: {preview.galleryUpload}</span>
                <span>Video: {preview.videoEmbed}</span>
                <span>Channel riêng: {preview.bookingChannel}</span>
              </div>
            </div>
          </div>
        </article>

        <article className="artist-dashboard-panel">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">Checklist</p>
              <h2>Những gì cần có trước khi public</h2>
            </div>
          </div>

          <div className="artist-dashboard-update-list">
            <div className="artist-dashboard-update-item">
              <span className="account-benefit-dot" />
              <p>Phải có tên outlet, địa phương, giờ hoạt động, vibe và mô tả ngắn rõ ràng.</p>
            </div>
            <div className="artist-dashboard-update-item">
              <span className="account-benefit-dot" />
              <p>Nên điền đủ table options, service notes, music mood và gallery để profile trông chuyên nghiệp.</p>
            </div>
            <div className="artist-dashboard-update-item">
              <span className="account-benefit-dot" />
              <p>Nên có ít nhất 1 ảnh cover, 1 ảnh đại diện và 1 link video hoặc teaser để profile outlet nhìn sống động hơn.</p>
            </div>
            <div className="artist-dashboard-update-item">
              <span className="account-benefit-dot" />
              <p>Channel Telegram riêng chỉ nhập tại profile edit này để sau này route booking đi đúng venue.</p>
            </div>
          </div>
        </article>
      </aside>
    </div>
  )
}
