import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { listSiteAccountsForCms } from '@/lib/site-user-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function accountTypeLabel(accountType: 'user' | 'artist', portalRole?: string) {
  if (accountType === 'user') return 'User'
  if (portalRole === 'manager') return 'Manager'
  if (portalRole === 'booking') return 'Booking Coordinator'
  return 'Nghệ sĩ'
}

export default async function CmsUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const result = await listSiteAccountsForCms({
    page: requestedPage,
    limit: CMS_LIST_PAGE_SIZE,
  })
  const page = Math.min(Math.max(1, result.totalPages), result.page)

  return (
    <CmsDashboardShell
      activeKey="users"
      title="Quản lý User"
      description="Theo dõi tài khoản thật trong database, số sao, vai trò và trạng thái truy cập của từng thành viên."
    >
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Accounts</p>
            <h2>Danh sách tài khoản mới nhất</h2>
            <p className="cms-muted">
              Có {result.totalDocs} tài khoản. Mỗi trang hiển thị tối đa {CMS_LIST_PAGE_SIZE} tài khoản.
            </p>
          </div>
          <div className="cms-inline-actions">
            <Link href="/cms/dashboard/admin-access" className="button-secondary">
              Duyệt cấp admin
            </Link>
          </div>
        </div>

        <div className="cms-table-wrap">
          <table className="cms-table cms-table-users">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tài khoản</th>
                <th>Loại</th>
                <th>Sao</th>
                <th>Gói</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Quyền CMS</th>
                <th>Truy cập</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user, index) => (
                <tr key={user.id}>
                  <td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td>
                  <td>
                    <strong>{user.name}</strong>
                    <span>{user.email || user.phone || user.id}</span>
                  </td>
                  <td>{accountTypeLabel(user.accountType, user.portalRole)}</td>
                  <td>{user.stars} sao</td>
                  <td>{user.isPremium ? 'Premium' : 'Free'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className="cms-status-chip">{user.isActive ? 'Đang hoạt động' : 'Tạm khóa'}</span>
                  </td>
                  <td>{user.role === 'customer' ? 'Không có' : user.role}</td>
                  <td>
                    {user.accountType === 'artist'
                      ? user.portalAccessStatus === 'approved'
                        ? 'Đã duyệt portal'
                        : 'Chờ duyệt portal'
                      : 'User dashboard'}
                  </td>
                  <td>
                    <div className="cms-table-actions">
                      <Link href={`/cms/dashboard/users/${user.id}`} className="cms-table-link">
                        Xem / chỉnh sửa
                      </Link>
                      <Link href="/cms/dashboard/admin-access" className="cms-table-link">
                        Quyền
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.users.length === 0 ? (
          <p className="cms-muted">Database chưa có tài khoản phù hợp.</p>
        ) : null}

        <CmsListPagination
          page={page}
          totalItems={result.totalDocs}
          baseHref="/cms/dashboard/users"
        />
      </section>
    </CmsDashboardShell>
  )
}
