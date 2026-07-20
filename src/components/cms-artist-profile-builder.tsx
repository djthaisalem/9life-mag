'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { artistPortalSections } from '@/lib/artist-portal-sections'

type StoredTemplateState = {
  values: Record<string, string>
  files: Record<string, string>
}

type StoredDraftState = Record<string, StoredTemplateState>
type DraftStatus = 'draft' | 'ready' | 'pending'

const CMS_ARTIST_DRAFT_STORAGE_KEY = 'nine-life-cms-artist-profile-draft-v1'

function getTemplateStorageId(sectionKey: string, templateTitle: string) {
  return `${sectionKey}:${templateTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9:-]/g, '')}`
}

function readStoredDraftState() {
  if (typeof window === 'undefined') return {} as StoredDraftState

  try {
    return JSON.parse(window.localStorage.getItem(CMS_ARTIST_DRAFT_STORAGE_KEY) ?? '{}') as StoredDraftState
  } catch {
    return {}
  }
}

function saveStoredDraftState(nextState: StoredDraftState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CMS_ARTIST_DRAFT_STORAGE_KEY, JSON.stringify(nextState))
}

export function CmsArtistProfileBuilder() {
  const [draftForms, setDraftForms] = useState<StoredDraftState>({})
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('draft')
  const [feedback, setFeedback] = useState('Chưa lưu thay đổi mới.')

  useEffect(() => {
    setDraftForms(readStoredDraftState())
  }, [])

  const updateFieldValue = (templateId: string, fieldName: string, value: string) => {
    setDraftForms((current) => ({
      ...current,
      [templateId]: {
        values: {
          ...(current[templateId]?.values ?? {}),
          [fieldName]: value,
        },
        files: current[templateId]?.files ?? {},
      },
    }))
  }

  const updateFileValue = (templateId: string, fieldName: string, fileName: string) => {
    setDraftForms((current) => ({
      ...current,
      [templateId]: {
        values: current[templateId]?.values ?? {},
        files: {
          ...(current[templateId]?.files ?? {}),
          [fieldName]: fileName,
        },
      },
    }))
  }

  const handleSaveDraft = () => {
    saveStoredDraftState(draftForms)
    setDraftStatus('draft')
    setFeedback('Đã lưu bản nháp cục bộ. Nghệ sĩ có thể tiếp tục điền và xem preview trước khi gửi duyệt.')
  }

  const handlePreviewReady = () => {
    saveStoredDraftState(draftForms)
    setDraftStatus('ready')
    setFeedback('Bản nháp đã sẵn sàng để preview. Chỉ khi admin duyệt thì profile mới được public ra site chính.')
  }

  const handleSendForReview = () => {
    saveStoredDraftState(draftForms)
    setDraftStatus('pending')
    setFeedback('Profile đã được đánh dấu chờ admin duyệt. Trước khi duyệt xong, profile vẫn chỉ ở trạng thái nháp/preview.')
  }

  const profileSummary = useMemo(() => {
    const allValues = Object.values(draftForms).flatMap((item) => Object.entries(item.values))
    const allFiles = Object.values(draftForms).flatMap((item) => Object.entries(item.files))
    const valueMap = Object.fromEntries(allValues)
    const fileMap = Object.fromEntries(allFiles)

    return {
      artistName: valueMap.artistName || 'Tên nghệ sĩ sẽ hiện ở đây',
      headline: valueMap.headline || 'Headline booking / performance positioning',
      shortBio: valueMap.shortBio || 'Phần bio ngắn sẽ hiện trong khu preview nháp để đối chiếu nhanh với profile public.',
      city: valueMap.city || 'Chưa khai báo thành phố hoạt động',
      role: valueMap.primaryRole || 'Chưa chọn vai trò chính',
      genres: valueMap.genres || 'Chưa điền tag dòng nhạc',
      bookingRate: valueMap.bookingRate || 'Liên hệ để biết thêm chi tiết',
      availability: valueMap.availability || 'Chưa cập nhật tình trạng nhận show',
      portrait: fileMap.portraitUpload || 'Chưa chọn ảnh portrait',
      cover: fileMap.coverUpload || 'Chưa chọn ảnh cover',
    }
  }, [draftForms])

  const statusLabel =
    draftStatus === 'pending'
      ? 'Chờ admin duyệt'
      : draftStatus === 'ready'
        ? 'Preview sẵn sàng'
        : 'Đang là bản nháp'

  return (
    <div className="cms-content">
      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Artist Draft Workflow</p>
            <h2>Tạo profile nghệ sĩ theo chuẩn public profile</h2>
            <p className="muted">
              Nghệ sĩ tạo xong sẽ lưu thành bản nháp, có thể xem preview nội bộ. Chỉ khi admin duyệt thì profile mới được public ra site chính.
            </p>
          </div>
          <div className="cms-inline-actions">
            <button type="button" className="button-secondary" onClick={handleSaveDraft}>
              Lưu bản nháp
            </button>
            <button type="button" className="button-secondary" onClick={handlePreviewReady}>
              Xem preview
            </button>
            <button type="button" className="button" onClick={handleSendForReview}>
              Gửi admin duyệt
            </button>
          </div>
        </div>

        <div className="cms-overview-stats">
          <article className="metric">
            <strong>{statusLabel}</strong>
            <span>Trạng thái hiện tại của hồ sơ</span>
          </article>
          <article className="metric">
            <strong>Draft</strong>
            <span>Nghệ sĩ điền thông tin và cập nhật dần theo từng khối</span>
          </article>
          <article className="metric">
            <strong>Preview</strong>
            <span>Xem trước bố cục và nội dung trước khi gửi duyệt</span>
          </article>
          <article className="metric">
            <strong>Public</strong>
            <span>Chỉ mở ra ngoài site sau khi admin duyệt</span>
          </article>
        </div>

        <p className="artist-editor-save-feedback">{feedback}</p>
      </article>

      <div className="artist-editor-shell">
        <div className="artist-editor-main">
          {artistPortalSections.map((section) => (
            <article key={section.key} className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">{section.eyebrow}</p>
                  <h2>{section.title}</h2>
                  <p className="artist-editor-panel-note">{section.intro}</p>
                </div>
                <div className="artist-editor-panel-actions">
                  <span className="artist-editor-static-note">{section.tabLabel}</span>
                  <Link href={section.publicHref} className="button-secondary">
                    {section.publicLabel}
                  </Link>
                </div>
              </div>

              <div className="artist-editor-workflow">
                {section.workflow.map((item) => (
                  <article key={item.title} className="artist-editor-workflow-card">
                    <div className="artist-editor-status-row">
                      <strong>{item.title}</strong>
                      <span className="artist-editor-status-pill">{item.status}</span>
                    </div>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>

              <div className="artist-editor-template-stack">
                {section.templates.map((template) => {
                  const templateId = getTemplateStorageId(section.key, template.title)
                  const templateValues = draftForms[templateId]?.values ?? {}
                  const templateFiles = draftForms[templateId]?.files ?? {}

                  return (
                    <article key={template.title} className="artist-editor-template-card">
                      <div className="artist-editor-template-head">
                        <div>
                          <strong>{template.title}</strong>
                          <p>{template.description}</p>
                        </div>
                        <span className="artist-editor-template-badge">Nháp nội bộ</span>
                      </div>

                      <form className="artist-editor-form-grid">
                        {template.fields.map((field) => (
                          <div
                            key={field.name}
                            className={`field${field.type === 'textarea' || field.type === 'file' ? ' artist-editor-field-wide' : ''}`}
                          >
                            <label htmlFor={`${templateId}-${field.name}`}>
                              {field.label}
                              {field.optional ? <span className="artist-editor-optional-tag">Tùy chọn</span> : null}
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                id={`${templateId}-${field.name}`}
                                name={field.name}
                                placeholder={field.placeholder}
                                value={templateValues[field.name] ?? ''}
                                onChange={(event) => updateFieldValue(templateId, field.name, event.target.value)}
                              />
                            ) : field.type === 'file' ? (
                              <div className="artist-editor-upload-card">
                                <input
                                  id={`${templateId}-${field.name}`}
                                  name={field.name}
                                  type="file"
                                  accept={field.accept}
                                  onChange={(event) =>
                                    updateFileValue(templateId, field.name, event.target.files?.[0]?.name ?? '')
                                  }
                                />
                                {field.maxSizeMb ? <span className="artist-editor-upload-limit">File hình tối đa {field.maxSizeMb}MB</span> : null}
                                {field.helper ? <span className="artist-editor-upload-size">{field.helper}</span> : null}
                                {templateFiles[field.name] ? (
                                  <span className="artist-editor-upload-file">Đã chọn: {templateFiles[field.name]}</span>
                                ) : null}
                              </div>
                            ) : field.type === 'select' ? (
                              <select
                                id={`${templateId}-${field.name}`}
                                name={field.name}
                                value={templateValues[field.name] ?? ''}
                                onChange={(event) => updateFieldValue(templateId, field.name, event.target.value)}
                              >
                                <option value="" disabled>
                                  Chọn nội dung
                                </option>
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`${templateId}-${field.name}`}
                                name={field.name}
                                placeholder={field.placeholder}
                                value={templateValues[field.name] ?? ''}
                                onChange={(event) => updateFieldValue(templateId, field.name, event.target.value)}
                              />
                            )}

                            {field.type !== 'file' && field.helper ? (
                              <span className="artist-editor-field-note">{field.helper}</span>
                            ) : null}
                          </div>
                        ))}
                      </form>
                    </article>
                  )
                })}
              </div>
            </article>
          ))}
        </div>

        <aside className="artist-editor-side">
          <article className="artist-dashboard-panel">
            <div className="artist-dashboard-panel-head">
              <div>
                <p className="section-eyebrow">Preview Draft</p>
                <h2>Xem trước hồ sơ nháp</h2>
              </div>
            </div>

            <div className="artist-profile-preview-card">
              <div className="artist-profile-preview-cover">
                <span>{profileSummary.cover}</span>
              </div>
              <div className="artist-profile-preview-body">
                <div className="artist-profile-preview-avatar">
                  <span>{profileSummary.portrait}</span>
                </div>
                <strong>{profileSummary.artistName}</strong>
                <p>{profileSummary.headline}</p>
                <div className="tag-row">
                  <span className="pill">{profileSummary.role}</span>
                  <span className="pill">{profileSummary.city}</span>
                </div>
                <p className="artist-profile-preview-copy">{profileSummary.shortBio}</p>
                <div className="artist-profile-preview-list">
                  <span>Genres: {profileSummary.genres}</span>
                  <span>Booking: {profileSummary.bookingRate}</span>
                  <span>Availability: {profileSummary.availability}</span>
                </div>
              </div>
            </div>
          </article>

          <article className="artist-dashboard-panel">
            <div className="artist-dashboard-panel-head">
              <div>
                <p className="section-eyebrow">Approval Rules</p>
                <h2>Điều kiện để được public</h2>
              </div>
            </div>

            <div className="artist-dashboard-update-list">
              <div className="artist-dashboard-update-item">
                <span className="account-benefit-dot" />
                <p>Phải có tên nghệ sĩ, headline, bio ngắn, vai trò chính và khu vực hoạt động.</p>
              </div>
              <div className="artist-dashboard-update-item">
                <span className="account-benefit-dot" />
                <p>Phải có ít nhất 1 ảnh portrait, 1 ảnh cover và 1 khối booking cơ bản.</p>
              </div>
              <div className="artist-dashboard-update-item">
                <span className="account-benefit-dot" />
                <p>Profile ở ngoài site chính chỉ mở public sau khi admin duyệt nội dung và hình ảnh.</p>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  )
}
