import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'

const userRows = [
  { id: 'minh-anh', name: 'Minh Anh', type: 'Admin', stars: '146 sao', plan: 'Premium active', activity: 'Theo dõi 12 nghệ sĩ', status: 'Đang hoạt động', admin: 'Đã cấp', access: 'Tổng quan, Bài viết, Nghệ sĩ, Music, Quản lý user, Booking' },
  { id: 'duy-khanh', name: 'Duy Khánh', type: 'User', stars: '24 sao', plan: 'Free', activity: '3 playlist, 18 vote', status: 'Chờ nạp thêm', admin: 'Không có', access: 'Chưa có quyền CMS' },
  { id: 'luna-flux', name: 'Luna Flux', type: 'Tài khoản nghệ sĩ', stars: '0 sao', plan: 'Artist portal', activity: 'Quản lý profile và music', status: 'Đã xác minh', admin: 'Chờ duyệt', access: 'Nghệ sĩ, Music, Booking' },
  { id: 'thao-vy', name: 'Thảo Vy', type: 'User', stars: '88 sao', plan: 'Free', activity: '4 lượt download tuần này', status: 'Có bonus chờ nhận', admin: 'Không có', access: 'Chưa có quyền CMS' },
  { id: 'ghost-frequency', name: 'Ghost Frequency', type: 'Tài khoản nghệ sĩ', stars: '0 sao', plan: 'Artist portal', activity: '2 booking lead mới', status: 'Đã xác minh', admin: 'Chờ duyệt', access: 'Nghệ sĩ, Music, Booking, Outlets' },
  { id: 'hai-nam', name: 'Hải Nam', type: 'Agent', stars: '9 sao', plan: 'Premium trial', activity: 'Nghe 7 nonstop hôm nay', status: 'Cần rà soát payload', admin: 'Từ chối', access: 'Nghệ sĩ' },
  { id: 'manager-portal-9life', name: '9LIFE Manager', type: 'Manager', stars: '0 sao', plan: 'Manager portal', activity: 'Map Agent và roster nghệ sĩ', status: 'Đã xác minh', admin: 'Chờ duyệt', access: 'Nghệ sĩ theo Agent' },
  { id: 'booking-portal-9life', name: '9LIFE Booking Coordinator', type: 'Booking Coordinator', stars: '0 sao', plan: 'Booking portal', activity: 'Map Outlet và điều phối đặt bàn', status: 'Đã xác minh', admin: 'Chờ duyệt', access: 'Booking theo Outlet' },
]

export default async function CmsUsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const totalPages = Math.max(1, Math.ceil(userRows.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const visibleUsers = userRows.slice((page - 1) * CMS_LIST_PAGE_SIZE, page * CMS_LIST_PAGE_SIZE)

  return <CmsDashboardShell activeKey="users" title="Quản lý User" description="Theo dõi hồ sơ, loại tài khoản, số sao, trạng thái hoạt động và yêu cầu quyền quản trị.">
    <section className="cms-panel">
      <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
        <div><p className="section-eyebrow">Accounts</p><h2>User, tài khoản nghệ sĩ, agent và admin</h2><p className="cms-muted">Mỗi trang hiển thị tối đa 20 tài khoản.</p></div>
        <div className="cms-inline-actions"><button type="button" className="button">Tạo tài khoản mới</button><Link href="/cms/dashboard/admin-access" className="button-secondary">Duyệt cấp admin</Link></div>
      </div>
      <div className="cms-table-wrap">
        <table className="cms-table cms-table-users">
          <thead><tr><th>STT</th><th>Tài khoản</th><th>Loại</th><th>Sao</th><th>Gói</th><th>Hoạt động</th><th>Trạng thái</th><th>Quyền admin</th><th>Truy cập</th><th>Thao tác</th></tr></thead>
          <tbody>{visibleUsers.map((user, index) => <tr key={user.id}><td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td><td><strong>{user.name}</strong><span>{user.id}</span></td><td>{user.type}</td><td>{user.stars}</td><td>{user.plan}</td><td>{user.activity}</td><td><span className="cms-status-chip">{user.status}</span></td><td>{user.admin}</td><td>{user.access}</td><td><div className="cms-table-actions"><Link href={`/cms/dashboard/users/${user.id}`} className="cms-table-link">Chỉnh sửa</Link><Link href="/cms/dashboard/admin-access" className="cms-table-link">Quyền</Link></div></td></tr>)}</tbody>
        </table>
      </div>
      <CmsListPagination page={page} totalItems={userRows.length} baseHref="/cms/dashboard/users" />
    </section>
  </CmsDashboardShell>
}
