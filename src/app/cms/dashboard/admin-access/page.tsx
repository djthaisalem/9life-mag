import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { getCmsAccessRequests } from '@/lib/cms-access-requests'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

const permissionLabels = ['Tổng quan', 'Bài viết', 'Quản lý user', 'Phân quyền admin', 'Nghệ sĩ', 'Music', 'Booking', 'Outlets', 'Sao / Thanh toán', 'API / Bảo mật']
const adminAccessRows = [
  { id: 'luna-flux', name: 'Luna Flux', email: 'portal.lunaflux@9lifemag.com', role: 'Tài khoản nghệ sĩ', status: 'Chờ duyệt', requested: 'Nghệ sĩ, Music, Booking', approved: 'Nghệ sĩ, Music', approver: 'Chưa duyệt' },
  { id: 'ghost-frequency', name: 'Ghost Frequency', email: 'portal.ghostfrequency@9lifemag.com', role: 'Tài khoản nghệ sĩ', status: 'Chờ duyệt', requested: 'Nghệ sĩ, Music, Booking, Outlets', approved: 'Nghệ sĩ, Music, Booking', approver: 'Admin chờ xác nhận' },
  { id: 'minh-anh', name: 'Minh Anh', email: 'minhanh@9lifemag.com', role: 'Admin', status: 'Đã cấp', requested: 'Tổng quan, Bài viết, Nghệ sĩ, Music, Quản lý user, Booking', approved: 'Tổng quan, Bài viết, Nghệ sĩ, Music, Quản lý user, Booking', approver: 'Super Admin' },
]

export default async function CmsAdminAccessPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const requests = await getCmsAccessRequests()
  const requestRows = requests.map((request) => ({ id: request.id, name: request.name, email: request.email, role: request.requestedRole, status: 'Chờ duyệt', requested: request.note || 'Yêu cầu quyền CMS', approved: 'Chưa cấp', approver: request.organization || 'Yêu cầu mới' }))
  const rows = [...requestRows, ...adminAccessRows]
  const totalPages = Math.max(1, Math.ceil(rows.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const visibleRows = rows.slice((page - 1) * CMS_LIST_PAGE_SIZE, page * CMS_LIST_PAGE_SIZE)
  return <CmsDashboardShell activeKey="admin-access" title="Phân quyền Admin" description="Duyệt quyền quản trị và giới hạn phạm vi truy cập chính xác cho từng tài khoản vận hành.">
    <section className="cms-panel"><div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Approval Queue</p><h2>Danh sách yêu cầu cấp quyền admin</h2><p className="cms-muted">Tối đa 20 yêu cầu mỗi trang, theo thứ tự yêu cầu mới trước.</p></div><Link className="button-secondary" href="/cms/dashboard/users">Sang quản lý user</Link></div>
      <div className="cms-table-wrap"><table className="cms-table cms-table-admin-access"><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th>Yêu cầu</th><th>Được cấp</th><th>Đơn vị / Duyệt bởi</th><th>Thao tác</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id}><td><strong>{repairVietnameseText(row.name)}</strong><span>{repairVietnameseText(row.email)}</span></td><td>{repairVietnameseText(row.role)}</td><td><span className="cms-status-chip">{repairVietnameseText(row.status)}</span></td><td>{repairVietnameseText(row.requested)}</td><td>{repairVietnameseText(row.approved)}</td><td>{repairVietnameseText(row.approver)}</td><td><div className="cms-table-actions"><Link className="cms-table-link" href="/cms/dashboard/users">Mở user</Link><Link className="cms-table-link" href="/cms/dashboard/admin-access">Duyệt</Link></div></td></tr>)}</tbody></table></div>
      <CmsListPagination page={page} totalItems={rows.length} baseHref="/cms/dashboard/admin-access" />
    </section>
    <section className="cms-panel"><p className="section-eyebrow">Permission Map</p><h2>Các mục có thể gắn quyền truy cập</h2><div className="cms-outlet-manage-meta">{permissionLabels.map((label) => <span key={label}>{label}</span>)}</div></section>
  </CmsDashboardShell>
}
