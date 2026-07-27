import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { getCmsArticleHtml, getCmsMediaReference } from '@/lib/cms-article-content'
import { loadPayloadClient } from '@/lib/payload-runtime'

export default async function CmsArticlePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await loadPayloadClient()
  const found = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const post = found.docs[0]
  if (!post) notFound()

  const cover = getCmsMediaReference(post.coverImage)
  const gallery = Array.isArray(post.gallery)
    ? post.gallery
      .map(getCmsMediaReference)
      .filter((image): image is NonNullable<typeof image> => Boolean(image))
    : []
  const html = getCmsArticleHtml(post.content)

  return (
    <CmsDashboardShell
      activeKey="articles"
      title={`Bản xem trước: ${post.title}`}
      description="Bản nháp nội bộ trong CMS, chưa hiển thị công khai trên site."
    >
      <div className="cms-inline-actions">
        <Link className="button-secondary" href="/cms/dashboard/articles/list">Quay lại danh sách</Link>
        <Link className="button" href={`/cms/dashboard/articles?edit=${post.slug}`}>Chỉnh sửa bài viết</Link>
      </div>

      <article className="panel">
        <div className="tag-row">
          <span className="pill">{post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}</span>
          <span className="pill">{post.updatedAt.slice(0, 10)}</span>
        </div>
        <h1 className="page-title article-title">{post.title}</h1>
        {post.excerpt ? <p className="page-intro article-summary">{post.excerpt}</p> : null}
        {cover ? <img className="article-hero-image" src={cover.url} alt={cover.alt || post.title} /> : null}
        <div
          className="article-body-shell"
          dangerouslySetInnerHTML={{ __html: html || '<p>Bài viết chưa có nội dung.</p>' }}
        />
        {gallery.length ? (
          <div className="cms-article-gallery-preview">
            {gallery.map((image) => <img key={image.id} src={image.url} alt={image.alt || post.title} />)}
          </div>
        ) : null}
      </article>
    </CmsDashboardShell>
  )
}
