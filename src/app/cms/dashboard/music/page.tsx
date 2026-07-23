import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { cmsMusicTabOptions, type CmsMusicTabKey } from '@/lib/cms-dashboard-data'
import { getCmsMusicLibraryPage } from '@/lib/cms-music-library'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

const validTabs = new Set<CmsMusicTabKey>(['all', 'track', 'nonstop', 'remix', 'playlist', 'album'])
const getTabHref = (tab: CmsMusicTabKey, query = '') => {
  const params = new URLSearchParams()
  if (tab !== 'all') params.set('tab', tab)
  if (query) params.set('q', query)
  const suffix = params.toString()
  return `/cms/dashboard/music${suffix ? `?${suffix}` : ''}`
}
const musicAccessLabels: Record<string, string> = { 'music-008': 'Trừ sao mới phát', 'music-006': 'Trừ sao mới phát', 'music-005': 'Trừ sao mới phát', 'music-001': 'Chờ nội bộ' }
const musicMapLabels: Record<string, string> = { 'music-004': 'Music dành cho bạn / Chia sẻ playlist', 'music-001': 'Chưa map' }

export default async function CmsMusicPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; q?: string }> }) {
  const params = await searchParams
  const activeTab = params.tab && validTabs.has(params.tab as CmsMusicTabKey) ? params.tab as CmsMusicTabKey : 'all'
  const query = params.q?.trim().slice(0, 100) ?? ''
  let page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  let library = await getCmsMusicLibraryPage({ tab: activeTab, query, page, pageSize: CMS_LIST_PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil(library.totalItems / CMS_LIST_PAGE_SIZE))
  if (page > totalPages) {
    page = totalPages
    library = await getCmsMusicLibraryPage({ tab: activeTab, query, page, pageSize: CMS_LIST_PAGE_SIZE })
  }
  const visibleMusic = library.rows
  const activeLabel = repairVietnameseText(cmsMusicTabOptions.find((item) => item.key === activeTab)?.label ?? 'Tất cả')

  return (
    <CmsDashboardShell activeKey="music" title="Quản lý Music">
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Music Control</p><h2>Upload và phân loại nội dung nhạc</h2></div>
          <div className="cms-inline-actions">
            <Link className="button-secondary" href="/cms/dashboard/music/categories">Tạo thể loại nhạc</Link>
            <Link className="cms-music-upload-action" href="/cms/dashboard/music/upload"><span aria-hidden="true">↑</span><span><strong>Upload nhạc</strong><small>Thêm track, nonstop hoặc remix</small></span></Link>
          </div>
        </div>
        <nav className="cms-tab-row" aria-label="Lọc thư viện nhạc">
          {cmsMusicTabOptions.map((option) => <Link key={option.key} className={option.key === activeTab ? 'cms-tab-button cms-tab-button-active' : 'cms-tab-button'} href={getTabHref(option.key, query)}>{repairVietnameseText(option.label)}</Link>)}
        </nav>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Library</p><h2>Danh sách nhạc từ mới đến cũ</h2><p className="cms-muted">Tối đa 20 nội dung mỗi trang trong tab {activeLabel}. Cột chỉnh sửa được đặt đầu tiên để thao tác nhanh.</p></div></div>
        <form className="cms-form-two" action="/cms/dashboard/music" method="get">
          {activeTab !== 'all' ? <input type="hidden" name="tab" value={activeTab} /> : null}
          <div className="field">
            <label htmlFor="musicLibrarySearch">Tìm trong thư viện nhạc</label>
            <input id="musicLibrarySearch" name="q" type="search" defaultValue={query} placeholder="Tên bài, mã 6 số, nghệ sĩ hoặc thể loại" />
          </div>
          <div className="cms-inline-actions">
            <button type="submit" className="button-secondary">Tìm kiếm</button>
            {query ? <Link className="button-secondary" href={getTabHref(activeTab)}>Xóa bộ lọc</Link> : null}
          </div>
        </form>
        <div className="cms-table-wrap">
          <table className="cms-table cms-table-music">
            <thead><tr><th>Chỉnh sửa</th><th>STT</th><th>Tên nhạc</th><th>Loại</th><th>Nghệ sĩ</th><th>Thể loại</th><th>Quyền</th><th>Map hiển thị</th><th>Cập nhật</th></tr></thead>
            <tbody>{visibleMusic.map((item, index) => <tr key={item.id}>
              <td><div className="cms-table-actions"><Link className="cms-table-link" href={`/cms/dashboard/music/${item.slug}`}>Chỉnh sửa</Link></div></td>
              <td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td>
              <td><strong>{repairVietnameseText(item.title)}</strong><span>{item.duration}</span></td>
              <td>{item.type === 'album' ? 'Album / EP' : item.type}</td>
              <td>{repairVietnameseText(item.artist || 'Chưa gắn nghệ sĩ')}</td>
              <td>{repairVietnameseText(item.genre)}</td>
              <td>{musicAccessLabels[item.id] ?? repairVietnameseText(item.access)}</td>
              <td>{musicMapLabels[item.id] ?? repairVietnameseText(item.mappedTo)}</td>
              <td>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.updatedAt))}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <CmsListPagination page={page} totalItems={library.totalItems} baseHref={getTabHref(activeTab, query)} />
      </section>
    </CmsDashboardShell>
  )
}
