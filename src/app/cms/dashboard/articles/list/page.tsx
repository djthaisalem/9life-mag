import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { newsCatalogSupplement } from '@/lib/news-catalog-supplement'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'
import { featuredArticles } from '@/lib/site-data'
import { CmsListSearchForm } from '@/components/cms-list-search-form'

export default async function CmsArticleListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const query = (params.q ?? '').trim().toLowerCase()
  const payload = await loadPayloadClient()
  const persisted = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 500,
    sort: '-updatedAt',
    overrideAccess: true,
  })
  const persistedCatalog = persisted.docs.map((article) => ({
    title: article.title,
    slug: article.slug,
    summary: article.excerpt ?? '',
    category: 'Bài viết CMS',
    date: article.updatedAt.slice(0, 10),
  }))
  const catalog = repairVietnameseValue([...persistedCatalog, ...featuredArticles, ...newsCatalogSupplement])
    .filter((article, index, rows) => rows.findIndex((item) => item.slug === article.slug) === index)
    .filter((article) => !query || [article.title, article.summary, article.category, article.slug].some((value) => value.toLowerCase().includes(query)))
  const totalPages = Math.max(1, Math.ceil(catalog.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1),
  )
  const rows = catalog.slice(
    (page - 1) * CMS_LIST_PAGE_SIZE,
    page * CMS_LIST_PAGE_SIZE,
  )

  return (
    <CmsDashboardShell
      activeKey="articles"
      title="Danh sách Bài viết"
      description="Theo dõi nội dung đã có, mở bài ngoài site hoặc chuyển thẳng về màn biên tập."
    >
      <div className="cms-booking-tabs">
        <Link href="/cms/dashboard/articles" className="cms-booking-tab">Soạn bài</Link>
        <Link href="/cms/dashboard/articles/list" className="cms-booking-tab cms-booking-tab-active">Danh sách bài viết</Link>
      </div>

      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Article Catalog</p>
            <h2>Bài viết mới nhất</h2>
            <p className="cms-muted">
              Có {catalog.length} bài viết, hiển thị tối đa {CMS_LIST_PAGE_SIZE} bài mỗi trang.
            </p>
          </div>
          <Link href="/cms/dashboard/articles" className="button">Tạo bài viết</Link>
        </div>

        <CmsListSearchForm className="cms-list-filter" action="/cms/dashboard/articles/list">
          <input name="q" type="search" defaultValue={params.q ?? ''} placeholder="Tìm theo tiêu đề, mô tả, chuyên mục hoặc slug" />
          <button type="submit" className="button-secondary">Tìm kiếm</button>
        </CmsListSearchForm>

        <div className="cms-table-wrap">
          <table className="cms-table cms-table-articles">
            <thead>
              <tr>
                <th>STT</th>
                <th>Bài viết</th>
                <th>Chuyên mục</th>
                <th>Ngày đăng</th>
                <th>Slug</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((article, index) => (
                <tr key={article.slug}>
                  <td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                  <td><strong>{article.title}</strong><span>{article.summary}</span></td>
                  <td>{article.category}</td>
                  <td>{article.date}</td>
                  <td>{article.slug}</td>
                  <td>
                    <div className="cms-table-actions">
                      <Link className="cms-table-link" href={`/tin-tuc/${article.slug}`}>Xem</Link>
                      <Link className="cms-table-link" href={`/cms/dashboard/articles?edit=${article.slug}`}>Chỉnh sửa</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CmsListPagination
          page={page}
          totalItems={catalog.length}
          baseHref="/cms/dashboard/articles/list"
        />
      </section>
    </CmsDashboardShell>
  )
}
