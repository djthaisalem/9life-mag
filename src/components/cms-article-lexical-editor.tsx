'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $setBlocksType } from '@lexical/selection'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
} from 'lexical'
import { getMediaEmbed } from '@/lib/media-embed'

const tools = ['B', 'I', 'U', 'Aa', 'H2', 'H3', 'Quote', 'Image', 'Gallery', 'Video', 'Embed', 'CTA', 'SEO', 'Preview'] as const

type ModalTool = 'image' | 'gallery' | 'video' | 'embed' | 'cta' | 'seo'

type ImageFormState = {
  url: string
  caption: string
  alt: string
  files: File[]
}

type GalleryFormState = {
  urls: string
  caption: string
  files: File[]
}

type VideoFormState = {
  title: string
  url: string
  iframe: string
  note: string
}

type EmbedFormState = {
  title: string
  source: string
  url: string
  iframe: string
}

type CtaFormState = {
  label: string
  href: string
  supportingText: string
}

type SeoFormState = {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  canonicalUrl: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function insertBlock(editor: LexicalEditor, text: string) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const paragraph = $createParagraphNode()
    paragraph.append($createTextNode(text))
    selection.insertNodes([paragraph])
  })
}

function insertHtmlBlock(editor: LexicalEditor, html: string) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const parser = new DOMParser()
    const dom = parser.parseFromString(html, 'text/html')
    const nodes = $generateNodesFromDOM(editor, dom)
    selection.insertNodes(nodes)
  })
}

async function filesToDataUrls(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        }),
    ),
  )
}

function splitUrls(input: string) {
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeYouTubeUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : url
    }

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      if (parsed.pathname.includes('/embed/')) return url
    }
  } catch {
    return url
  }

  return url
}

function getEmbedSource(url: string, iframe: string) {
  if (!iframe.trim()) return url.trim()
  return iframe.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() ?? ''
}

function getSafeHref(value: string) {
  const href = value.trim()
  if (href.startsWith('/')) return href
  try {
    const url = new URL(href)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '#'
  } catch {
    return '#'
  }
}

function buildSafeEmbedFrame(source: string, title: string) {
  const embed = getMediaEmbed(source)
  if (!embed) return ''
  return `<iframe src="${escapeHtml(embed.src)}" title="${escapeHtml(title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
}

function buildVideoMarkup({ title, url, iframe, note }: VideoFormState) {
  const rawTitle = title || 'Video nhúng'
  const safeTitle = escapeHtml(rawTitle)
  const safeNote = note ? `<p>${escapeHtml(note)}</p>` : ''

  const embedFrame = buildSafeEmbedFrame(getEmbedSource(url, iframe), rawTitle)
  if (embedFrame) {
    return `
      <section class="cms-article-video">
        <strong>${safeTitle}</strong>
        <div class="cms-article-video-frame">${embedFrame}</div>
        ${safeNote}
      </section>
    `
  }

    const normalizedUrl = normalizeYouTubeUrl(url)
  const safeUrl = escapeHtml(normalizedUrl)
  const isEmbeddable =
    normalizedUrl.includes('youtube.com/embed/') ||
    normalizedUrl.includes('facebook.com/plugins/video.php')

  if (isEmbeddable) {
    return `
      <section class="cms-article-video">
        <strong>${safeTitle}</strong>
        <div class="cms-article-video-frame">
          <iframe src="${safeUrl}" title="${safeTitle}" loading="lazy" allowfullscreen></iframe>
        </div>
        ${safeNote}
      </section>
    `
  }

  return `
    <section class="cms-article-video">
      <strong>${safeTitle}</strong>
        <p><a href="${escapeHtml(getSafeHref(url))}" target="_blank" rel="noreferrer">Mở video</a></p>
      ${safeNote}
    </section>
  `
}

function buildEmbedMarkup({ title, source, url, iframe }: EmbedFormState) {
  const rawTitle = title || 'Embed media'
  const safeTitle = escapeHtml(rawTitle)
  const safeSource = escapeHtml(source || 'Nguồn nhúng')

  const embedFrame = buildSafeEmbedFrame(getEmbedSource(url, iframe), rawTitle)
  if (embedFrame) {
    return `
      <section class="cms-article-embed">
        <strong>${safeTitle}</strong>
        <span>${safeSource}</span>
        <div class="cms-article-video-frame">${embedFrame}</div>
      </section>
    `
  }

  return `
    <section class="cms-article-embed">
      <strong>${safeTitle}</strong>
      <span>${safeSource}</span>
        <p><a href="${escapeHtml(getSafeHref(url))}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></p>
    </section>
  `
}

function buildCtaMarkup({ label, href, supportingText }: CtaFormState) {
  return `
    <section class="cms-article-cta">
        <a class="button" href="${escapeHtml(getSafeHref(href))}">${escapeHtml(label || 'Xem thêm')}</a>
      ${supportingText ? `<p>${escapeHtml(supportingText)}</p>` : ''}
    </section>
  `
}

function buildSeoMarkup({ metaTitle, metaDescription, focusKeyword, canonicalUrl }: SeoFormState) {
  return `
    <aside class="cms-article-seo-note">
      <strong>SEO note</strong>
      <p><b>Meta title:</b> ${escapeHtml(metaTitle || 'Chưa điền')}</p>
      <p><b>Meta description:</b> ${escapeHtml(metaDescription || 'Chưa điền')}</p>
      <p><b>Focus keyword:</b> ${escapeHtml(focusKeyword || 'Chưa điền')}</p>
      <p><b>Canonical:</b> ${escapeHtml(canonicalUrl || 'Chưa điền')}</p>
    </aside>
  `
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [activeModal, setActiveModal] = useState<ModalTool | null>(null)
  const [imageForm, setImageForm] = useState<ImageFormState>({ url: '', caption: '', alt: '', files: [] })
  const [galleryForm, setGalleryForm] = useState<GalleryFormState>({ urls: '', caption: '', files: [] })
  const [videoForm, setVideoForm] = useState<VideoFormState>({ title: '', url: '', iframe: '', note: '' })
  const [embedForm, setEmbedForm] = useState<EmbedFormState>({ title: '', source: '', url: '', iframe: '' })
  const [ctaForm, setCtaForm] = useState<CtaFormState>({ label: '', href: '', supportingText: '' })
  const [seoForm, setSeoForm] = useState<SeoFormState>({
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
  })

  const closeModal = () => setActiveModal(null)

  const openModal = (tool: ModalTool) => {
    setActiveModal(tool)
  }

  const applyTool = (tool: (typeof tools)[number]) => {
    switch (tool) {
      case 'B':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        return
      case 'I':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        return
      case 'U':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
        return
      case 'H2':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h2'))
          }
        })
        return
      case 'H3':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h3'))
          }
        })
        return
      case 'Quote':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode())
          }
        })
        return
      case 'Aa':
        insertBlock(editor, 'Đoạn chữ nhấn mạnh')
        return
      case 'Image':
        openModal('image')
        return
      case 'Gallery':
        openModal('gallery')
        return
      case 'Video':
        openModal('video')
        return
      case 'Embed':
        openModal('embed')
        return
      case 'CTA':
        openModal('cta')
        return
      case 'SEO':
        openModal('seo')
        return
      case 'Preview':
        insertBlock(editor, '[Preview note] Kiểm tra headline, media và CTA')
        return
      default:
        return
    }
  }

  const submitImage = async () => {
    const uploadedImages = imageForm.files.length > 0 ? await filesToDataUrls(imageForm.files) : []
    const providedUrls = imageForm.url ? [imageForm.url.trim()] : []
    const sources = [...uploadedImages, ...providedUrls].filter(Boolean)
    if (sources.length === 0) return

    const markup = sources
      .map(
        (src) => `
          <figure>
            <img src="${escapeHtml(src)}" alt="${escapeHtml(imageForm.alt || imageForm.caption || 'Image')}" />
            ${imageForm.caption ? `<figcaption>${escapeHtml(imageForm.caption)}</figcaption>` : ''}
          </figure>
        `,
      )
      .join('')

    insertHtmlBlock(editor, markup)
    setImageForm({ url: '', caption: '', alt: '', files: [] })
    closeModal()
  }

  const submitGallery = async () => {
    const uploadedImages = galleryForm.files.length > 0 ? await filesToDataUrls(galleryForm.files) : []
    const providedUrls = splitUrls(galleryForm.urls)
    const sources = [...uploadedImages, ...providedUrls].filter(Boolean)
    if (sources.length === 0) return

    const markup = `
      <section class="cms-article-gallery">
        ${galleryForm.caption ? `<strong>${escapeHtml(galleryForm.caption)}</strong>` : ''}
        <div class="cms-article-gallery-grid">
          ${sources
            .map(
              (src, index) => `
                <figure>
                  <img src="${escapeHtml(src)}" alt="${escapeHtml(`Gallery image ${index + 1}`)}" />
                </figure>
              `,
            )
            .join('')}
        </div>
      </section>
    `

    insertHtmlBlock(editor, markup)
    setGalleryForm({ urls: '', caption: '', files: [] })
    closeModal()
  }

  const submitVideo = () => {
    if (!videoForm.url.trim() && !videoForm.iframe.trim()) return
    insertHtmlBlock(editor, buildVideoMarkup(videoForm))
    setVideoForm({ title: '', url: '', iframe: '', note: '' })
    closeModal()
  }

  const submitEmbed = () => {
    if (!embedForm.url.trim() && !embedForm.iframe.trim()) return
    insertHtmlBlock(editor, buildEmbedMarkup(embedForm))
    setEmbedForm({ title: '', source: '', url: '', iframe: '' })
    closeModal()
  }

  const submitCta = () => {
    if (!ctaForm.label.trim()) return
    insertHtmlBlock(editor, buildCtaMarkup(ctaForm))
    setCtaForm({ label: '', href: '', supportingText: '' })
    closeModal()
  }

  const submitSeo = () => {
    insertHtmlBlock(editor, buildSeoMarkup(seoForm))
    setSeoForm({ metaTitle: '', metaDescription: '', focusKeyword: '', canonicalUrl: '' })
    closeModal()
  }

  return (
    <>
      <div className="cms-editor-toolbar">
        {tools.map((tool) => (
          <button
            key={tool}
            type="button"
            className="cms-toolbar-chip"
            onMouseDown={(event) => {
              event.preventDefault()
              applyTool(tool)
            }}
          >
            {tool}
          </button>
        ))}
      </div>

      {activeModal ? (
        <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true">
          <div className="cms-editor-modal">
            <div className="cms-editor-modal-head">
              <div>
                <strong>
                  {activeModal === 'image' && 'Chèn ảnh'}
                  {activeModal === 'gallery' && 'Chèn gallery'}
                  {activeModal === 'video' && 'Chèn video'}
                  {activeModal === 'embed' && 'Chèn embed media'}
                  {activeModal === 'cta' && 'Chèn CTA'}
                  {activeModal === 'seo' && 'Ghi chú SEO'}
                </strong>
                <span>
                  {activeModal === 'image' && 'Tải ảnh lên hoặc dán link có đuôi ảnh.'}
                  {activeModal === 'gallery' && 'Nhiều ảnh cho recap, lookbook hoặc album sự kiện.'}
                  {activeModal === 'video' && 'Dán link YouTube/Facebook hoặc iframe để nhúng trực tiếp.'}
                  {activeModal === 'embed' && 'Dùng cho SoundCloud, Spotify, Facebook post hoặc iframe khác.'}
                  {activeModal === 'cta' && 'CTA là nút kêu gọi hành động như đặt bàn, xem thêm, đăng ký.'}
                  {activeModal === 'seo' && 'SEO note để editor lưu meta title, mô tả, từ khóa và canonical.'}
                </span>
              </div>
              <button type="button" className="button-secondary" onClick={closeModal}>
                Đóng
              </button>
            </div>

            {activeModal === 'image' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsImageUpload">Tải ảnh lên</label>
                  <input
                    id="cmsImageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setImageForm((current) => ({
                        ...current,
                        files: Array.from(event.currentTarget.files ?? []),
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsImageUrl">Hoặc dán link ảnh</label>
                  <input
                    id="cmsImageUrl"
                    value={imageForm.url}
                    placeholder="https://domain.com/cover.jpg"
                    onChange={(event) => setImageForm((current) => ({ ...current, url: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsImageAlt">Alt ảnh</label>
                  <input
                    id="cmsImageAlt"
                    value={imageForm.alt}
                    placeholder="Mô tả ảnh để SEO và accessibility"
                    onChange={(event) => setImageForm((current) => ({ ...current, alt: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsImageCaption">Caption</label>
                  <input
                    id="cmsImageCaption"
                    value={imageForm.caption}
                    placeholder="Chú thích ảnh"
                    onChange={(event) => setImageForm((current) => ({ ...current, caption: event.currentTarget.value }))}
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitImage}>
                    Chèn ảnh
                  </button>
                </div>
              </div>
            ) : null}

            {activeModal === 'gallery' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsGalleryUpload">Tải nhiều ảnh lên</label>
                  <input
                    id="cmsGalleryUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setGalleryForm((current) => ({
                        ...current,
                        files: Array.from(event.currentTarget.files ?? []),
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsGalleryUrls">Hoặc dán nhiều link ảnh</label>
                  <textarea
                    id="cmsGalleryUrls"
                    value={galleryForm.urls}
                    placeholder="Mỗi dòng một link ảnh hoặc phân tách bằng dấu phẩy"
                    onChange={(event) => setGalleryForm((current) => ({ ...current, urls: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsGalleryCaption">Tiêu đề / caption gallery</label>
                  <input
                    id="cmsGalleryCaption"
                    value={galleryForm.caption}
                    placeholder="Ví dụ: Album đêm khai trương"
                    onChange={(event) => setGalleryForm((current) => ({ ...current, caption: event.currentTarget.value }))}
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitGallery}>
                    Chèn gallery
                  </button>
                </div>
              </div>
            ) : null}

            {activeModal === 'video' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsVideoTitle">Tiêu đề video</label>
                  <input
                    id="cmsVideoTitle"
                    value={videoForm.title}
                    placeholder="Aftermovie / interview / live set..."
                    onChange={(event) => setVideoForm((current) => ({ ...current, title: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsVideoUrl">Link video</label>
                  <input
                    id="cmsVideoUrl"
                    value={videoForm.url}
                    placeholder="https://youtube.com/watch?v=..."
                    onChange={(event) => setVideoForm((current) => ({ ...current, url: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsVideoIframe">Hoặc iframe embed</label>
                  <textarea
                    id="cmsVideoIframe"
                    value={videoForm.iframe}
                    placeholder="<iframe ...></iframe>"
                    onChange={(event) => setVideoForm((current) => ({ ...current, iframe: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsVideoNote">Ghi chú dưới video</label>
                  <input
                    id="cmsVideoNote"
                    value={videoForm.note}
                    placeholder="Ví dụ: Set được ghi hình tại Hà Nội"
                    onChange={(event) => setVideoForm((current) => ({ ...current, note: event.currentTarget.value }))}
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitVideo}>
                    Chèn video
                  </button>
                </div>
              </div>
            ) : null}

            {activeModal === 'embed' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsEmbedTitle">Tên nội dung embed</label>
                  <input
                    id="cmsEmbedTitle"
                    value={embedForm.title}
                    placeholder="SoundCloud player / Spotify playlist / Facebook post..."
                    onChange={(event) => setEmbedForm((current) => ({ ...current, title: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsEmbedSource">Nguồn</label>
                  <input
                    id="cmsEmbedSource"
                    value={embedForm.source}
                    placeholder="SoundCloud / Spotify / Facebook / Khác"
                    onChange={(event) => setEmbedForm((current) => ({ ...current, source: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsEmbedUrl">Link media</label>
                  <input
                    id="cmsEmbedUrl"
                    value={embedForm.url}
                    placeholder="https://soundcloud.com/..."
                    onChange={(event) => setEmbedForm((current) => ({ ...current, url: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsEmbedIframe">Hoặc iframe embed</label>
                  <textarea
                    id="cmsEmbedIframe"
                    value={embedForm.iframe}
                    placeholder="<iframe ...></iframe>"
                    onChange={(event) => setEmbedForm((current) => ({ ...current, iframe: event.currentTarget.value }))}
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitEmbed}>
                    Chèn embed
                  </button>
                </div>
              </div>
            ) : null}

            {activeModal === 'cta' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsCtaLabel">Nhãn nút</label>
                  <input
                    id="cmsCtaLabel"
                    value={ctaForm.label}
                    placeholder="Đặt bàn ngay / Xem profile / Nghe full set"
                    onChange={(event) => setCtaForm((current) => ({ ...current, label: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsCtaHref">Link đích</label>
                  <input
                    id="cmsCtaHref"
                    value={ctaForm.href}
                    placeholder="/dat-ban hoặc https://..."
                    onChange={(event) => setCtaForm((current) => ({ ...current, href: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsCtaText">Dòng hỗ trợ dưới nút</label>
                  <input
                    id="cmsCtaText"
                    value={ctaForm.supportingText}
                    placeholder="Ví dụ: Ưu tiên booking cuối tuần"
                    onChange={(event) =>
                      setCtaForm((current) => ({ ...current, supportingText: event.currentTarget.value }))
                    }
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitCta}>
                    Chèn CTA
                  </button>
                </div>
              </div>
            ) : null}

            {activeModal === 'seo' ? (
              <div className="cms-editor-modal-form">
                <div className="field">
                  <label htmlFor="cmsSeoTitle">Meta title</label>
                  <input
                    id="cmsSeoTitle"
                    value={seoForm.metaTitle}
                    placeholder="Tiêu đề SEO muốn hiển thị trên Google"
                    onChange={(event) => setSeoForm((current) => ({ ...current, metaTitle: event.currentTarget.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsSeoDescription">Meta description</label>
                  <textarea
                    id="cmsSeoDescription"
                    value={seoForm.metaDescription}
                    placeholder="Mô tả ngắn để search engine và social preview đọc"
                    onChange={(event) =>
                      setSeoForm((current) => ({ ...current, metaDescription: event.currentTarget.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsSeoKeyword">Focus keyword</label>
                  <input
                    id="cmsSeoKeyword"
                    value={seoForm.focusKeyword}
                    placeholder="Ví dụ: DJ nữ Việt Nam, nightlife Hà Nội..."
                    onChange={(event) =>
                      setSeoForm((current) => ({ ...current, focusKeyword: event.currentTarget.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="cmsSeoCanonical">Canonical URL</label>
                  <input
                    id="cmsSeoCanonical"
                    value={seoForm.canonicalUrl}
                    placeholder="https://9lifemag.com/tin-tuc/..."
                    onChange={(event) =>
                      setSeoForm((current) => ({ ...current, canonicalUrl: event.currentTarget.value }))
                    }
                  />
                </div>
                <div className="cms-inline-actions">
                  <button type="button" className="button" onClick={submitSeo}>
                    Chèn ghi chú SEO
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

function HtmlSyncPlugin({
  html,
  onHtmlChange,
}: {
  html: string
  onHtmlChange: (html: string) => void
}) {
  const [editor] = useLexicalComposerContext()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return

    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      const root = $getRoot()
      root.clear()
      root.append(...nodes)
      if (root.getChildrenSize() === 0) {
        root.append($createParagraphNode().append($createTextNode('')))
      }
    })

    initializedRef.current = true
  }, [editor, html])

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          onHtmlChange($generateHtmlFromNodes(editor, null))
        })
      }}
    />
  )
}

export function CmsArticleLexicalEditor({
  html,
  onHtmlChange,
}: {
  html: string
  onHtmlChange: (html: string) => void
}) {
  const initialConfig = useMemo(
    () => ({
      namespace: 'cms-article-editor',
      onError(error: Error) {
        throw error
      },
      nodes: [HeadingNode, QuoteNode],
      theme: {},
    }),
    [],
  )

  return (
    <div className="cms-editor-shell cms-editor-shell-wide">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="cms-editor-body cms-editor-body-wide cms-editor-body-rich">
          <RichTextPlugin
            contentEditable={<ContentEditable id="postBody" className="cms-article-rich-editor" />}
            placeholder={<div className="cms-editor-placeholder">Soạn full bài viết tại đây...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <HtmlSyncPlugin html={html} onHtmlChange={onHtmlChange} />
        </div>
      </LexicalComposer>
    </div>
  )
}
