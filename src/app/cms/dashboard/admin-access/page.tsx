import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { getCmsAccessRequests } from '@/lib/cms-access-requests'
import { listSiteAccountsForCms } from '@/lib/site-user-session'

const permissionLabels = [
  'Tổng quan',
  'Bài viết',
  'Quản lý user',
  'Phân quyền admin',
  'Nghệ sĩ',
  'Music',
  'Booking',
  'Outlets',
  'Sao / Thanh toán',
  'Referral',
  'API / Bảo mật',
]

type AccessRow = {
  id: string
  userId?: string
  name: string
  email: string
  role: string
  status: string
  requested: string
  approved: string
  approver: string
  createdAt: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsAdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const [requests, accountResult] = await Promise.all([
    getCmsAccessRequests(),
    listSiteAccountsForCms({ page: 1, limit: 100 }),
  ])

  const requestRows: AccessRow[] = requests.map((request) => {
    const account = accountResult.users.find(
      (user) => user.email.toLowerCase() === request.email.toLowerCase(),
    )
    return {
      id: `request-${request.id}`,
      userId: account?.id,
      name: request.name,
      email: request.email,
      role: request.requestedRole,
      status: 'Chờ duyệt',
      requested: request.note || 'Yêu cầu quyền truy cập CMS',
      approved: 'Chưa cấp',
      approver: request.organization || 'Yêu cầu mới',
      createdAt: request.createdAt,
    }
  })

  const activeAdminRows: AccessRow[] = accountResult.users
    .filter((user) => user.role !== 'customer')
    .map((user) => ({
      id: `user-${user.id}`,
      userId: user.id,
      name: user.name,
      email: user.email || user.phone,
      role: user.role,
      status: user.isActive ? 'Đang hoạt động' : 'Tạm khóa',
      requested: 'Tài khoản vận hành hiện tại',
      approved: user.role,
      approver: 'Database hệ thống',
      createdAt: user.createdAt,
    }))

  const rows = [...requestRows, ...activeAdminRows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1),
  )
  const visibleRows = rows.slice(
    (page - 1) * CMS_LIST_PAGE_SIZE,
    page * CMS_LIST_PAGE_SIZE,
  )

  return (
    <CmsDashboardShell
      activeKey="admin-access"
      title="Phân quyền Admin"
      description="Theo dõi yêu cầu mới và các tài khoản đang có quyền vận hành CMS."
    >
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Approval Queue</p>
            <h2>Danh sách phân quyền mới nhất</h2>
            <p className="cms-muted">
              Dữ liệu được đọc trực tiếp từ tài khoản và yêu cầu cấp quyền trong database.
            </p>
          </div>
          <Link className="button-secondary" href="/cms/dashboard/users">
            Sang quản lý user
          </Link>
        </div>

        <div className="cms-table-wrap">
          <table className="cms-table cms-table-admin-access">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Yêu cầu</th>
                <th>Được cấp</th>
                <th>Đơn vị / Nguồn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.name}</strong><span>{row.email}</span></td>
                  <td>{row.role}</td>
                  <td><span className="cms-status-chip">{row.status}</span></td>
                  <td>{row.requested}</td>
                  <td>{row.approved}</td>
                  <td>{row.approver}</td>
                  <td>
                    <div className="cms-table-actions">
                      <Link
                        className="cms-table-link"
                        href={row.userId ? `/cms/dashboard/users/${row.userId}` : '/cms/dashboard/users'}
                      >
                        {row.userId ? 'Mở và chỉnh sửa' : 'Tìm tài khoản'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleRows.length === 0 ? (
          <p className="cms-muted">Chưa có yêu cầu hoặc tài khoản admin trong database.</p>
        ) : null}

        <CmsListPagination
          page={page}
          totalItems={rows.length}
          baseHref="/cms/dashboard/admin-access"
        />
      </section>

      <section className="cms-panel">
        <p className="section-eyebrow">Permission Map</p>
        <h2>Các phạm vi có thể cấp quyền</h2>
        <div className="cms-outlet-manage-meta">
          {permissionLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </section>
    </CmsDashboardShell>
  )
}
