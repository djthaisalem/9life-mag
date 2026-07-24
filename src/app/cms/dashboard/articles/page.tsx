'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CmsArticleLexicalEditor } from '@/components/cms-article-lexical-editor'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsNewsPlacementOptions, newsSignalCards } from '@/lib/news-taxonomy'
import { featuredArticles } from '@/lib/site-data'
import { newsCatalogSupplement } from '@/lib/news-catalog-supplement'
import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'

type ArticleSeries = { title: string; description: string; placement: string; status: string }

const initialSeries: ArticleSeries[] = [
  { title: 'Nightlife Spotlight', description: 'Chuỗi bài nổi bật về nightlife, sự kiện và những đêm diễn đáng chú ý.', placement: 'Trang chủ + /tin-tuc', status: 'Đang áp dụng' },
  { title: 'Artist Deep Dive', description: 'Phỏng vấn, hồ sơ và nội dung chuyên sâu về nghệ sĩ.', placement: '/tin-tuc + /nghe-si/[slug]', status: 'Chờ bài mới' },
  { title: 'Club Radar', description: 'Câu chuyện về outlet, lịch event và trải nghiệm địa phương.', placement: '/dat-ban + /tin-tuc', status: 'Đang lên lịch' },
]

const articleCategories = ['Tin nightlife', 'Phỏng vấn nghệ sĩ', 'Music release', 'Outlet spotlight', 'Recap sự kiện', 'Văn hóa club']
const initialArticleHtml = '<h2>Tiêu đề mở bài</h2><p>Soạn bài viết tại đây, bôi chọn đoạn văn rồi dùng thanh công cụ để định dạng, chèn hình ảnh, video hoặc CTA.</p><p>Chuyển sang chế độ HTML khi cần chỉnh trực tiếp mã nội dung.</p>'

export default function CmsArticlesPage() {
  const articleCatalog = useMemo(
    () => repairVietnameseValue([...featuredArticles, ...newsCatalogSupplement]),
    [],
  )
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  const [articleHtml, setArticleHtml] = useState(initialArticleHtml)
  const [seriesList, setSeriesList] = useState(initialSeries)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<(typeof newsSignalCards)[number]['key']>('hot-topic')
  const [postPlacement, setPostPlacement] = useState('Feed tin tức')
  const [seriesForm, setSeriesForm] = useState({ title: '', description: '', placement: '', status: 'Nháp' })
  const [postTitle, setPostTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [postExcerpt, setPostExcerpt] = useState('')
  const [postCategory, setPostCategory] = useState(articleCategories[0])
  const htmlRef = useRef<HTMLTextAreaElement | null>(null)
  const activeSignal = newsSignalCards.find((signal) => signal.key === selectedSignal) ?? newsSignalCards[0]

  const autoGrow = (element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.max(element.scrollHeight, 760)}px`
  }

  useEffect(() => { if (editorMode === 'html') autoGrow(htmlRef.current) }, [articleHtml, editorMode])
  useEffect(() => {
    const editSlug = new URLSearchParams(window.location.search).get('edit')
    const editArticle = articleCatalog.find((article) => article.slug === editSlug)
    if (!editArticle) return
    setPostTitle(editArticle.title)
    setPostSlug(editArticle.slug)
    setPostExcerpt(editArticle.summary)
    setPostCategory(editArticle.category)
  }, [articleCatalog])

  const applySignal = (signal: (typeof newsSignalCards)[number]) => {
    setSelectedSignal(signal.key)
    setPostPlacement(signal.placement)
  }

  const submitSeries = () => {
    if (!seriesForm.title.trim()) return
    setSeriesList((current) => [{ title: seriesForm.title.trim(), description: seriesForm.description.trim() || 'Chuyên đề mới được tạo trong CMS.', placement: seriesForm.placement.trim() || 'Chưa gắn vị trí hiển thị', status: seriesForm.status }, ...current])
    setSeriesForm({ title: '', description: '', placement: '', status: 'Nháp' })
    setIsSeriesModalOpen(false)
  }

  return <CmsDashboardShell activeKey="articles" title="Quản lý Bài viết" description="Soạn, biên tập và phân phối bài viết đến đúng chuyên mục, vị trí hiển thị và đối tượng độc giả.">
    <div className="cms-booking-tabs">
      <Link href="/cms/dashboard/articles" className="cms-booking-tab cms-booking-tab-active">Soạn bài</Link>
      <Link href="/cms/dashboard/articles/list" className="cms-booking-tab">Danh sách bài viết</Link>
    </div>
    <article className="panel">
      <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Article Series</p><h2>Chuyên đề bài viết</h2><p className="cms-muted">Nhóm các bài cùng chiến dịch, nhân vật hoặc chủ đề để quản lý và phân phối nhất quán.</p></div><button type="button" className="button" onClick={() => setIsSeriesModalOpen(true)}>Tạo chuyên đề</button></div>
      <div className="cms-link-grid">{seriesList.map((series) => <article key={series.title} className="cms-link-card"><strong>{series.title}</strong><span>{series.description}</span><span>{series.placement}</span><span className="pill">{series.status}</span></article>)}</div>
    </article>

    <article className="panel">
      <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Tín hiệu tin tức</p><h2>Điểm ưu tiên hiển thị</h2><p className="cms-muted">Chọn vị trí phù hợp để bài viết xuất hiện đúng nhóm nội dung trên trang Tin tức.</p></div></div>
      <div className="cms-link-grid cms-news-signal-grid">{newsSignalCards.map((signal) => <article key={signal.key} className={signal.key === selectedSignal ? 'cms-link-card cms-link-card-active' : 'cms-link-card'}><div className="cms-news-signal-card-head"><strong>{signal.label}</strong><button type="button" className="button-secondary" onClick={() => applySignal(signal)}>Áp dụng</button></div><span>{signal.value}</span><Link className="cms-table-link" href={`/tin-tuc?signal=${signal.key}`}>Xem trên site</Link></article>)}</div>
    </article>

    <article className="panel cms-article-editor-panel">
      <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Editorial Desk</p><h2>Editor bài đăng</h2></div><div className="cms-inline-actions"><button type="button" className={editorMode === 'rich' ? 'button-secondary cms-mode-button-active' : 'button-secondary'} onClick={() => setEditorMode('rich')}>Soạn bài</button><button type="button" className={editorMode === 'html' ? 'button-secondary cms-mode-button-active' : 'button-secondary'} onClick={() => setEditorMode('html')}>Edit HTML</button><button type="button" className="button">Xem preview</button></div></div>
      <form className="form-shell cms-embedded-form">
        <div className="cms-article-meta-grid"><div className="field"><label htmlFor="postTitle">Tiêu đề bài viết</label><input id="postTitle" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Headline nổi bật cho nightlife / entertainment" /></div><div className="field"><label htmlFor="postSlug">Slug / đường dẫn</label><input id="postSlug" value={postSlug} onChange={(event) => setPostSlug(event.target.value)} placeholder="nightlife-weekend-saigon" /></div><div className="field"><label htmlFor="postCategory">Chuyên mục</label><select id="postCategory" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>{articleCategories.map((category) => <option key={category}>{category}</option>)}</select></div><div className="field"><label htmlFor="postSeries">Chuyên đề</label><select id="postSeries">{seriesList.map((series) => <option key={series.title}>{series.title}</option>)}<option>Không gắn chuyên đề</option></select></div><div className="field"><label htmlFor="postStatus">Trạng thái</label><select id="postStatus"><option>Nháp</option><option>Chờ media</option><option>Chờ duyệt</option><option>Xuất bản</option><option>Lên lịch</option></select></div><div className="field"><label htmlFor="postPlacement">Vị trí hiển thị</label><select id="postPlacement" value={postPlacement} onChange={(event) => setPostPlacement(event.currentTarget.value)}>{cmsNewsPlacementOptions.map((placement) => <option key={placement}>{placement}</option>)}</select><span className="cms-field-hint">Đang áp dụng: {activeSignal.label}</span></div></div>
        <div className="field"><label htmlFor="postExcerpt">Tóm tắt</label><textarea id="postExcerpt" value={postExcerpt} onChange={(event) => setPostExcerpt(event.target.value)} placeholder="Viết 2-3 câu ngắn cho card, SEO intro và feed tin tức..." /></div>
        <div className="field"><label htmlFor={editorMode === 'html' ? 'postHtml' : 'postBody'}>Nội dung chính {editorMode === 'html' ? '/ HTML' : ''}</label></div>
        {editorMode === 'rich' ? <CmsArticleLexicalEditor html={articleHtml} onHtmlChange={setArticleHtml} /> : <div className="cms-editor-shell cms-editor-shell-wide"><div className="cms-editor-body cms-editor-body-wide"><textarea id="postHtml" ref={htmlRef} value={articleHtml} className="cms-article-html-input" placeholder="<article>...</article>" onChange={(event) => setArticleHtml(event.currentTarget.value)} onInput={(event) => autoGrow(event.currentTarget)} /></div></div>}
        <div className="cms-editor-body cms-editor-body-wide"><div className="cms-article-meta-grid"><div className="field"><label htmlFor="coverImage">Ảnh cover</label><input id="coverImage" placeholder="Upload hoặc dán URL ảnh cover" /></div><div className="field"><label htmlFor="galleryImages">Gallery ảnh</label><input id="galleryImages" placeholder="Danh sách ảnh cho recap hoặc phỏng vấn" /></div><div className="field"><label htmlFor="youtubeEmbed">Embed YouTube</label><input id="youtubeEmbed" placeholder="https://youtube.com/watch?v=..." /></div><div className="field"><label htmlFor="facebookEmbed">Embed Facebook video</label><input id="facebookEmbed" placeholder="https://facebook.com/.../videos/..." /></div></div></div>
        <div className="cms-inline-actions"><button type="button" className="button">Lưu bài</button><button type="button" className="button-secondary">Gửi duyệt</button><button type="button" className="button-secondary">Lưu bản HTML</button></div>
      </form>
    </article>

    {isSeriesModalOpen ? <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true"><div className="cms-editor-modal"><div className="cms-editor-modal-head"><div><strong>Tạo chuyên đề bài viết</strong><span>Nhóm bài theo chiến dịch, nhân vật, địa phương hoặc vị trí hiển thị.</span></div><button type="button" className="button-secondary" onClick={() => setIsSeriesModalOpen(false)}>Đóng</button></div><div className="cms-editor-modal-form"><div className="field"><label htmlFor="seriesTitle">Tên chuyên đề</label><input id="seriesTitle" value={seriesForm.title} placeholder="Ví dụ: Festival Summer Pulse" onChange={(event) => setSeriesForm((current) => ({ ...current, title: event.currentTarget.value }))} /></div><div className="field"><label htmlFor="seriesDescription">Mô tả ngắn</label><textarea id="seriesDescription" value={seriesForm.description} placeholder="Mục tiêu và dạng bài viết của chuyên đề" onChange={(event) => setSeriesForm((current) => ({ ...current, description: event.currentTarget.value }))} /></div><div className="field"><label htmlFor="seriesPlacement">Áp dụng lên đâu</label><input id="seriesPlacement" value={seriesForm.placement} placeholder="Trang chủ + /tin-tuc" onChange={(event) => setSeriesForm((current) => ({ ...current, placement: event.currentTarget.value }))} /></div><div className="field"><label htmlFor="seriesStatus">Trạng thái</label><select id="seriesStatus" value={seriesForm.status} onChange={(event) => setSeriesForm((current) => ({ ...current, status: event.currentTarget.value }))}><option>Nháp</option><option>Đang áp dụng</option><option>Chờ bài mới</option><option>Đang lên lịch</option></select></div><div className="cms-inline-actions"><button type="button" className="button" onClick={submitSeries}>Lưu chuyên đề</button></div></div></div></div> : null}
  </CmsDashboardShell>
}
