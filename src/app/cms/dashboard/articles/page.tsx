'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CmsArticleLexicalEditor } from '@/components/cms-article-lexical-editor'
import type { ArticleSeoMetadata } from '@/lib/article-seo-metadata'
import { useCmsCapability } from '@/components/cms-capability-provider'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsArticlePlacementOptions } from '@/lib/news-taxonomy'
import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'
import { toUrlSlug } from '@/lib/url-slug'

type ArticleSeries = { title: string; description: string; placement: string; status: string }
type ArticleImage = { id?: string; file?: File; preview: string; alt: string }

const initialSeries: ArticleSeries[] = [
  { title: 'Nightlife Spotlight', description: 'Chuỗi bài nổi bật về nightlife, sự kiện và những đêm diễn đáng chú ý.', placement: 'Trang chủ + /tin-tuc', status: 'Đang áp dụng' },
  { title: 'Artist Deep Dive', description: 'Phỏng vấn, hồ sơ và nội dung chuyên sâu về nghệ sĩ.', placement: '/tin-tuc + /nghe-si/[slug]', status: 'Chờ bài mới' },
  { title: 'Club Radar', description: 'Câu chuyện về outlet, lịch event và trải nghiệm địa phương.', placement: '/dat-ban + /tin-tuc', status: 'Đang lên lịch' },
]

const defaultArticleCategories = ['Sự kiện', 'Nightlife', 'Nghệ sĩ', 'Review', 'Hậu trường', 'Xu hướng', 'Âm nhạc']
const initialArticleHtml = '<h2>Tiêu đề mở bài</h2><p>Soạn bài viết tại đây, bôi chọn đoạn văn rồi dùng thanh công cụ để định dạng, chèn hình ảnh, video hoặc CTA.</p><p>Chuyển sang chế độ HTML khi cần chỉnh trực tiếp mã nội dung.</p>'

function normalizeArticleCategory(value: string) {
  const slug = toUrlSlug(value)
  if (slug.includes('nghe-si') || slug.includes('artist')) return 'Nghệ sĩ'
  if (slug.includes('am-nhac') || slug.includes('music')) return 'Âm nhạc'
  if (slug.includes('su-kien') || slug.includes('event')) return 'Sự kiện'
  if (slug.includes('hau-truong') || slug.includes('backstage')) return 'Hậu trường'
  if (slug.includes('nightlife') || slug.includes('outlet')) return 'Nightlife'
  if (slug.includes('review')) return 'Review'
  return defaultArticleCategories.includes(value) ? value : 'Xu hướng'
}

export default function CmsArticlesPage() {
  const capability = useCmsCapability('content')
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  const [articleHtml, setArticleHtml] = useState(initialArticleHtml)
  const [articleSeo, setArticleSeo] = useState<ArticleSeoMetadata>({})
  const [seriesList, setSeriesList] = useState(initialSeries)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [postPlacement, setPostPlacement] = useState('Feed tin tức')
  const [seriesForm, setSeriesForm] = useState({ title: '', description: '', placement: '', status: 'Nháp' })
  const [postTitle, setPostTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [postExcerpt, setPostExcerpt] = useState('')
  const [articleCategories, setArticleCategories] = useState(defaultArticleCategories)
  const [postCategory, setPostCategory] = useState(defaultArticleCategories[0])
  const [postTopic, setPostTopic] = useState('')
  const [postStatus, setPostStatus] = useState<'draft' | 'scheduled' | 'published'>('draft')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [coverImage, setCoverImage] = useState<ArticleImage | null>(null)
  const [galleryImages, setGalleryImages] = useState<ArticleImage[]>([])
  const htmlRef = useRef<HTMLTextAreaElement | null>(null)
  const updateSeriesForm = (field: keyof typeof seriesForm, value: string) =>
    setSeriesForm((current) => ({ ...current, [field]: value }))

  const autoGrow = (element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.max(element.scrollHeight, 760)}px`
  }

  useEffect(() => { if (editorMode === 'html') autoGrow(htmlRef.current) }, [articleHtml, editorMode])
  useEffect(() => {
    let cancelled = false
    const loadTaxonomy = async () => {
      try {
        const response = await fetch('/api/cms/article-taxonomy', {
          credentials: 'include',
          headers: capability ? { Authorization: `Bearer ${capability}` } : undefined,
        })
        const result = await response.json() as { ok?: boolean; categories?: Array<{ name: string }>; topics?: Array<{ name: string; description?: string }> }
        if (!response.ok || !result.ok || cancelled) return
        if (result.categories?.length) setArticleCategories(result.categories.map((entry) => entry.name))
        if (result.topics?.length) setSeriesList(result.topics.map((entry) => ({ title: entry.name, description: entry.description || 'Chuyên đề bài viết', placement: 'Feed tin tức', status: 'Đang áp dụng' })))
      } catch {
        // Keep the built-in taxonomy available if the request is temporarily unavailable.
      }
    }
    void loadTaxonomy()
    return () => { cancelled = true }
  }, [capability])
  useEffect(() => {
    const editSlug = new URLSearchParams(window.location.search).get('edit')
    if (!editSlug) return

    let cancelled = false
    const loadPersistedArticle = async () => {
      try {
        const response = await fetch(`/api/cms/articles?slug=${encodeURIComponent(editSlug)}`, {
          credentials: 'include',
          headers: capability ? { Authorization: `Bearer ${capability}` } : undefined,
        })
        const result = await response.json() as {
          ok?: boolean
          post?: {
            title: string
            slug: string
            category: string
            topic: string
            placement: string
            excerpt: string
            html: string
            status?: 'draft' | 'scheduled' | 'published'
            seo?: ArticleSeoMetadata
            coverImage: { id: string; url: string; alt: string } | null
            gallery: Array<{ id: string; url: string; alt: string }>
          }
        }
        if (!response.ok || !result.ok || !result.post || cancelled) throw new Error()

        setPostTitle(result.post.title)
        setPostSlug(result.post.slug)
        setPostCategory(normalizeArticleCategory(result.post.category))
        setPostTopic(result.post.topic || '')
        setPostPlacement(repairVietnameseValue(result.post.placement || 'Feed tin tức'))
        setPostExcerpt(result.post.excerpt)
        setPostStatus(result.post.status === 'published' || result.post.status === 'scheduled' ? result.post.status : 'draft')
        setArticleHtml(result.post.html || initialArticleHtml)
        setArticleSeo(result.post.seo ?? {})
        setCoverImage(result.post.coverImage
          ? { id: result.post.coverImage.id, preview: result.post.coverImage.url, alt: result.post.coverImage.alt }
          : null)
        setGalleryImages(result.post.gallery.map((image) => ({
          id: image.id,
          preview: image.url,
          alt: image.alt,
        })))
      } catch {
        if (!cancelled) {
          setSaveMessage('Không tìm thấy bài viết thật trong database.')
        }
      }
    }

    void loadPersistedArticle()
    return () => { cancelled = true }
  }, [capability])

  const makeArticleImage = (file: File): ArticleImage => ({
    file,
    preview: URL.createObjectURL(file),
    alt: file.name.replace(/\.[^.]+$/, ''),
  })

  const uploadArticleImage = async (image: ArticleImage, role: 'cover' | 'gallery') => {
    if (image.id) return image
    if (!image.file) throw new Error('Ảnh chưa sẵn sàng để upload.')

    const formData = new FormData()
    formData.append('file', image.file)
    formData.append('alt', `${postTitle || 'Bài viết'} - ${role === 'cover' ? 'cover' : image.alt}`)
    const response = await fetch('/api/cms/articles/upload', {
      method: 'POST',
      credentials: 'include',
      headers: capability ? { Authorization: `Bearer ${capability}` } : undefined,
      body: formData,
    })
    const raw = await response.text()
    let result: { ok?: boolean; message?: string; media?: { id: string; url: string; alt: string } } = {}
    try { result = JSON.parse(raw) as typeof result } catch { /* The status below is more useful than a JSON parse error. */ }
    if (!response.ok || !result.ok || !result.media) throw new Error(result.message ?? `Upload ảnh bị máy chủ từ chối (HTTP ${response.status}).`)
    return { ...image, id: result.media.id, preview: result.media.url, alt: result.media.alt }
  }

  const saveArticle = async (options?: { status?: 'draft' | 'scheduled' | 'published'; successMessage?: string }) => {
    const normalizedSlug = toUrlSlug(postSlug || postTitle)
    if (!normalizedSlug) {
      setSaveMessage('Nhập tiêu đề bài viết để hệ thống tạo đường dẫn.')
      return
    }
    setIsSaving(true)
    setSaveMessage('')
    try {
      const uploadedCover = coverImage ? await uploadArticleImage(coverImage, 'cover') : null
      const uploadedGallery = await Promise.all(galleryImages.map((image) => uploadArticleImage(image, 'gallery')))
      setCoverImage(uploadedCover)
      setGalleryImages(uploadedGallery)
      const response = await fetch('/api/cms/articles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({
          title: postTitle,
          slug: normalizedSlug,
          category: postCategory,
          topic: postTopic,
          placement: postPlacement,
          excerpt: postExcerpt,
          html: articleHtml,
          seo: articleSeo,
          coverImageId: uploadedCover?.id,
          galleryImageIds: uploadedGallery.map((image) => image.id).filter((id): id is string => Boolean(id)),
          status: options?.status ?? postStatus,
        }),
      })
      const raw = await response.text()
      let result: {
        ok?: boolean
        message?: string
        post?: {
          slug?: string
          status?: 'draft' | 'scheduled' | 'published'
          publishedAt?: string
        }
      } = {}
      try { result = JSON.parse(raw) as typeof result } catch { /* Keep the server status visible to the editor. */ }
      if (!response.ok || !result.ok) throw new Error(result.message ?? `Lưu bài viết bị máy chủ từ chối (HTTP ${response.status}).`)
      setPostSlug(normalizedSlug)
      const persistedStatus = result.post?.status ?? options?.status ?? postStatus
      setPostStatus(persistedStatus)
      setSaveMessage(
        options?.successMessage ??
          result.message ??
          (persistedStatus === 'published' ? 'Đã xuất bản bài viết ngoài site.' : 'Đã lưu bài viết.'),
      )
    } catch (error) {
      if (error instanceof Error) {
        setSaveMessage(error.message)
        return
      }
      setSaveMessage('Không thể kết nối tới tiến trình lưu bài viết.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteArticle = async () => {
    const slug = toUrlSlug(postSlug || postTitle)
    if (!slug || !window.confirm('Xóa bài viết này khỏi CMS? Thao tác không thể hoàn tác.')) return

    setIsDeleting(true)
    setSaveMessage('')
    try {
      const response = await fetch(`/api/cms/articles?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: capability ? { Authorization: `Bearer ${capability}` } : undefined,
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message ?? 'Không thể xóa bài viết.')
      window.location.assign('/cms/dashboard/articles/list')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Không thể xóa bài viết lúc này.')
      setIsDeleting(false)
    }
  }

  const submitSeries = async (kind: 'category' | 'topic') => {
    if (!seriesForm.title.trim()) return
    try {
      const response = await fetch('/api/cms/article-taxonomy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({ kind, name: seriesForm.title, description: seriesForm.description }),
      })
      const result = await response.json() as { ok?: boolean; entry?: { name: string; description?: string }; message?: string }
      if (!response.ok || !result.ok || !result.entry) throw new Error(result.message ?? 'Không thể lưu taxonomy.')
      if (kind === 'category') setArticleCategories((current) => current.includes(result.entry!.name) ? current : [...current, result.entry!.name])
      else setSeriesList((current) => current.some((item) => item.title === result.entry!.name) ? current : [{ title: result.entry!.name, description: result.entry!.description || 'Chuyên đề mới được tạo trong CMS.', placement: seriesForm.placement.trim() || 'Feed tin tức', status: seriesForm.status }, ...current])
      setSeriesForm({ title: '', description: '', placement: '', status: 'Nháp' })
      setIsSeriesModalOpen(false)
      setIsCategoryModalOpen(false)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Không thể lưu taxonomy.')
    }
  }

  return <CmsDashboardShell activeKey="articles" title="Quản lý Bài viết" description="Soạn, biên tập và phân phối bài viết đến đúng chuyên mục, vị trí hiển thị và đối tượng độc giả.">
    <div className="cms-booking-tabs">
      <Link href="/cms/dashboard/articles" className="cms-booking-tab cms-booking-tab-active">Soạn bài</Link>
      <Link href="/cms/dashboard/articles/list" className="cms-booking-tab">Danh sách bài viết</Link>
    </div>
    <article className="panel">
      <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Article Taxonomy</p><h2>Chuyên mục và chuyên đề</h2><p className="cms-muted">Tạo taxonomy thật để bài viết được map đúng nhóm trên trang tin tức.</p></div><div className="cms-inline-actions"><button type="button" className="button-secondary" onClick={() => setIsCategoryModalOpen(true)}>Tạo chuyên mục</button><button type="button" className="button" onClick={() => setIsSeriesModalOpen(true)}>Tạo chuyên đề</button></div></div>
    </article>

    <article className="panel cms-article-editor-panel">
      <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Editorial Desk</p><h2>Editor bài đăng</h2></div><div className="cms-inline-actions"><button type="button" className={editorMode === 'rich' ? 'button-secondary cms-mode-button-active' : 'button-secondary'} onClick={() => setEditorMode('rich')}>Soạn bài</button><button type="button" className={editorMode === 'html' ? 'button-secondary cms-mode-button-active' : 'button-secondary'} onClick={() => setEditorMode('html')}>Edit HTML</button><button type="button" className="button" onClick={() => setIsPreviewOpen(true)}>Xem preview</button></div></div>
      <div className="form-shell cms-embedded-form">
        <div className="cms-article-meta-grid"><div className="field"><label htmlFor="postTitle">Tiêu đề bài viết</label><input id="postTitle" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Headline nổi bật cho nightlife / entertainment" /></div><div className="field"><label htmlFor="postSlug">Slug / đường dẫn</label><input id="postSlug" value={postSlug} onChange={(event) => setPostSlug(event.target.value)} placeholder="nightlife-weekend-saigon" /></div><div className="field"><label htmlFor="postCategory">Chuyên mục</label><select id="postCategory" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>{articleCategories.map((category) => <option key={category}>{category}</option>)}</select></div><div className="field"><label htmlFor="postSeries">Chuyên đề</label><select id="postSeries" value={postTopic} onChange={(event) => setPostTopic(event.currentTarget.value)}><option value="">Không gắn chuyên đề</option>{seriesList.map((series) => <option key={series.title} value={series.title}>{series.title}</option>)}</select></div><div className="field"><label htmlFor="postStatus">Trạng thái</label><select id="postStatus" value={postStatus} onChange={(event) => setPostStatus(event.currentTarget.value as typeof postStatus)}><option value="draft">Nháp</option><option value="scheduled">Chờ duyệt</option><option value="published">Xuất bản</option></select></div></div>
        <fieldset className="cms-map-fieldset cms-article-placement-fieldset">
          <legend>Gắn bài viết vào</legend>
          <p>Chọn một vị trí chính. Sau khi xuất bản, bài viết sẽ được đưa vào đúng khu vực này bằng dữ liệu thật.</p>
          <div className="cms-article-placement-grid">
            {cmsArticlePlacementOptions.map((option) => (
              <label key={option.value} className={postPlacement === option.value ? 'cms-article-placement-option cms-article-placement-option-active' : 'cms-article-placement-option'}>
                <input type="radio" name="postPlacement" value={option.value} checked={postPlacement === option.value} onChange={() => setPostPlacement(option.value)} />
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field"><label htmlFor="postExcerpt">Tóm tắt</label><textarea id="postExcerpt" value={postExcerpt} onChange={(event) => setPostExcerpt(event.target.value)} placeholder="Viết 2-3 câu ngắn cho card, SEO intro và feed tin tức..." /></div>
        <div className="field"><label htmlFor={editorMode === 'html' ? 'postHtml' : 'postBody'}>Nội dung chính {editorMode === 'html' ? '/ HTML' : ''}</label></div>
        {editorMode === 'rich' ? <CmsArticleLexicalEditor html={articleHtml} seoMetadata={articleSeo} onSeoMetadataChange={setArticleSeo} onHtmlChange={setArticleHtml} onPreview={() => setIsPreviewOpen(true)} /> : <div className="cms-editor-shell cms-editor-shell-wide"><div className="cms-editor-body cms-editor-body-wide"><textarea id="postHtml" ref={htmlRef} value={articleHtml} className="cms-article-html-input" placeholder="<article>...</article>" onChange={(event) => setArticleHtml(event.currentTarget.value)} onInput={(event) => autoGrow(event.currentTarget)} /></div></div>}
        <aside className="cms-article-seo-summary" aria-label="Metadata SEO của bài viết">
          <div>
            <span>SEO metadata</span>
            <strong>{articleSeo.title || 'Chưa đặt tiêu đề SEO riêng'}</strong>
          </div>
          <p>{articleSeo.description || 'Chưa có meta description. Hệ thống sẽ dùng phần tóm tắt bài viết.'}</p>
          <small>
            {[articleSeo.primaryKeywords, articleSeo.secondaryKeywords].filter(Boolean).join(', ') || 'Chưa có từ khóa SEO'}
          </small>
        </aside>
        <div className="cms-article-media-fields">
          <div className="field">
            <label htmlFor="articleCoverUpload">Ảnh cover</label>
            <input id="articleCoverUpload" type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) setCoverImage(makeArticleImage(file)); event.currentTarget.value = '' }} />
            <span className="cms-field-hint">Chọn 1 ảnh cover, tối đa 10MB.</span>
            {coverImage ? <div className="cms-article-image-preview"><img src={coverImage.preview} alt={coverImage.alt} /><button type="button" className="button-secondary" onClick={() => setCoverImage(null)}>Bỏ ảnh</button></div> : null}
          </div>
          <div className="field">
            <label htmlFor="articleGalleryUpload">Gallery ảnh</label>
            <input id="articleGalleryUpload" type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []).slice(0, Math.max(0, 20 - galleryImages.length)); if (files.length) setGalleryImages((current) => [...current, ...files.map(makeArticleImage)]); event.currentTarget.value = '' }} />
            <span className="cms-field-hint">Chọn nhiều ảnh, tối đa 20 ảnh và 10MB mỗi ảnh.</span>
            {galleryImages.length ? <div className="cms-article-gallery-preview">{galleryImages.map((image, index) => <div key={`${image.preview}-${index}`}><img src={image.preview} alt={image.alt} /><button type="button" className="button-secondary" onClick={() => setGalleryImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Xóa</button></div>)}</div> : null}
          </div>
        </div>
        <div className="cms-editor-body cms-editor-body-wide"><div className="cms-article-meta-grid"><div className="field"><label htmlFor="coverImage">Ảnh cover</label><input id="coverImage" placeholder="Upload hoặc dán URL ảnh cover" /></div><div className="field"><label htmlFor="galleryImages">Gallery ảnh</label><input id="galleryImages" placeholder="Danh sách ảnh cho recap hoặc phỏng vấn" /></div><div className="field"><label htmlFor="youtubeEmbed">Embed YouTube</label><input id="youtubeEmbed" placeholder="https://youtube.com/watch?v=..." /></div><div className="field"><label htmlFor="facebookEmbed">Embed Facebook video</label><input id="facebookEmbed" placeholder="https://facebook.com/.../videos/..." /></div></div></div>
        <div className="cms-inline-actions"><button type="button" className="button" disabled={isSaving || isDeleting} onClick={() => void saveArticle()}>{isSaving ? 'Đang lưu...' : 'Lưu bài'}</button><button type="button" className="button" disabled={isSaving || isDeleting} onClick={() => void saveArticle({ status: 'published', successMessage: 'Đã xuất bản bài viết ngoài site.' })}>Xuất bản ngay</button><button type="button" className="button-secondary" disabled={isSaving || isDeleting} onClick={() => void saveArticle({ status: 'scheduled', successMessage: 'Đã lưu bài viết và chuyển sang chờ duyệt.' })}>Gửi duyệt</button><button type="button" className="button-secondary" disabled={isSaving || isDeleting} onClick={() => void saveArticle({ successMessage: 'Đã lưu bản HTML vào database.' })}>Lưu bản HTML</button>{postSlug ? <button type="button" className="button-secondary" disabled={isSaving || isDeleting} onClick={() => void deleteArticle()}>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}</button> : null}</div>
        {saveMessage ? <p className="cms-field-hint" role="status">{saveMessage}</p> : null}
      </div>
    </article>

    {isPreviewOpen ? <div className="cms-article-live-preview-overlay" role="dialog" aria-modal="true" aria-label="Xem trước bài viết">
      <article className="cms-article-live-preview">
        <div className="cms-article-live-preview-head">
          <div><p className="section-eyebrow">Bản xem trước chưa lưu</p><strong>{postTitle || 'Bài viết chưa có tiêu đề'}</strong></div>
          <button type="button" className="button-secondary" onClick={() => setIsPreviewOpen(false)}>Đóng preview</button>
        </div>
        <div className="cms-article-live-preview-scroll">
          <div className="tag-row"><span className="pill">{postCategory}</span><span className="pill">{postPlacement}</span></div>
          <h1 className="page-title article-title">{postTitle || 'Bài viết chưa có tiêu đề'}</h1>
          {postExcerpt ? <p className="page-intro article-summary">{postExcerpt}</p> : null}
          {coverImage ? <img className="article-hero-image" src={coverImage.preview} alt={coverImage.alt || postTitle} /> : null}
          <div className="article-body-shell" dangerouslySetInnerHTML={{ __html: articleHtml || '<p>Bài viết chưa có nội dung.</p>' }} />
          {galleryImages.length ? <section className="cms-article-live-gallery">
            <h2>Gallery</h2>
            <div>{galleryImages.map((image, index) => <figure key={`${image.preview}-${index}`}><img src={image.preview} alt={image.alt || `${postTitle} ${index + 1}`} /></figure>)}</div>
          </section> : null}
        </div>
      </article>
    </div> : null}

    {isSeriesModalOpen || isCategoryModalOpen ? <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true"><div className="cms-editor-modal"><div className="cms-editor-modal-head"><div><strong>{isCategoryModalOpen ? 'Tạo chuyên mục bài viết' : 'Tạo chuyên đề bài viết'}</strong><span>{isCategoryModalOpen ? 'Chuyên mục được map trực tiếp vào trang Tin tức.' : 'Nhóm bài theo chiến dịch, nhân vật, địa phương hoặc vị trí hiển thị.'}</span></div><button type="button" className="button-secondary" onClick={() => { setIsSeriesModalOpen(false); setIsCategoryModalOpen(false) }}>Đóng</button></div><div className="cms-editor-modal-form"><div className="field"><label htmlFor="seriesTitle">{isCategoryModalOpen ? 'Tên chuyên mục' : 'Tên chuyên đề'}</label><input id="seriesTitle" value={seriesForm.title} placeholder={isCategoryModalOpen ? 'Ví dụ: Fashion & Lifestyle' : 'Ví dụ: Festival Summer Pulse'} onChange={(event) => updateSeriesForm('title', event.currentTarget.value)} /></div>{!isCategoryModalOpen ? <><div className="field"><label htmlFor="seriesDescription">Mô tả ngắn</label><textarea id="seriesDescription" value={seriesForm.description} placeholder="Mục tiêu và dạng bài viết của chuyên đề" onChange={(event) => updateSeriesForm('description', event.currentTarget.value)} /></div><div className="field"><label htmlFor="seriesPlacement">Áp dụng lên đâu</label><input id="seriesPlacement" value={seriesForm.placement} placeholder="Trang chủ + /tin-tuc" onChange={(event) => updateSeriesForm('placement', event.currentTarget.value)} /></div></> : null}<div className="cms-inline-actions"><button type="button" className="button" onClick={() => void submitSeries(isCategoryModalOpen ? 'category' : 'topic')}>Lưu taxonomy</button></div></div></div></div> : null}
  </CmsDashboardShell>
}
