import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { cmsArtistRows } from '@/lib/cms-dashboard-data'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

export default async function CmsArtistsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const totalPages = Math.max(1, Math.ceil(cmsArtistRows.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const visibleArtists = cmsArtistRows.slice((page - 1) * CMS_LIST_PAGE_SIZE, page * CMS_LIST_PAGE_SIZE)

  return (
    <CmsDashboardShell
      activeKey="artists"
      title="Quản lý Nghệ sĩ"
      description="Danh sách nghệ sĩ theo cột rõ ràng để kiểm tra hồ sơ, quyền sở hữu, booking và trạng thái hiển thị."
    >
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Artist Catalog</p>
            <h2>Danh sách nghệ sĩ hệ thống</h2>
            <p className="cms-muted">Mỗi trang hiển thị tối đa 20 hồ sơ, theo thứ tự catalog hiện có.</p>
          </div>
          <Link className="cms-artist-catalog-action" href="/cms/dashboard/artists/new">
            <span aria-hidden="true">+</span>
            <span>
              <strong>Tạo catalog nghệ sĩ</strong>
              <small>Tạo hồ sơ mới để chờ duyệt hoặc xuất bản</small>
            </span>
          </Link>
          <Link className="button-secondary" href="/cms/dashboard/artists/agents">
            Quản lý profile Agent
          </Link>
        </div>
        <div className="cms-table-wrap">
          <table className="cms-table cms-table-artists">
            <thead><tr><th>STT</th><th>Nghệ sĩ</th><th>Lĩnh vực</th><th>Giới tính</th><th>Khu vực</th><th>Agent quản lý</th><th>Booking</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
            <tbody>
              {visibleArtists.map((artist, index) => (
                <tr key={artist.id}>
                  <td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                  <td><strong>{repairVietnameseText(artist.name)}</strong><span>{artist.slug}</span></td>
                  <td>{repairVietnameseText(artist.field)}</td>
                  <td>{repairVietnameseText(artist.gender)}</td>
                  <td>{repairVietnameseText(artist.city)}</td>
                  <td>{repairVietnameseText(artist.agent)}</td>
                  <td>{repairVietnameseText(artist.rate)}</td>
                  <td><span className="cms-status-chip">{repairVietnameseText(artist.visibility)}</span></td>
                  <td><div className="cms-table-actions"><Link className="cms-table-link" href={`/cms/dashboard/artists/${artist.slug}`}>Chỉnh sửa</Link><Link className="cms-table-link" href={`/nghe-si/${artist.slug}`}>Xem site</Link></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CmsListPagination page={page} totalItems={cmsArtistRows.length} baseHref="/cms/dashboard/artists" />
      </section>
    </CmsDashboardShell>
  )
}
