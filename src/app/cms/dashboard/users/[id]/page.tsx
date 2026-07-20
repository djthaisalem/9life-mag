import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsPermissionOptions, getCmsUserById } from '@/lib/cms-dashboard-data'
import { CmsPortalRoleMapping } from '@/components/cms-portal-role-mapping'

export default async function CmsUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = getCmsUserById(id)

  if (!user) notFound()

  return (
    <CmsDashboardShell
      activeKey="users"
      title={`User: ${user.name}`}
      description="Trang chi tiết để xem hồ sơ user, duyệt quyền admin và gắn những mục CMS mà tài khoản đó được phép truy cập."
    >
      <div className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
            <div>
              <p className="section-eyebrow">Profile</p>
              <h2>Thông tin tài khoản</h2>
            </div>
            <div className="cms-inline-actions">
              <Link href="/cms/dashboard/users" className="button-secondary">
                Quay lại user
              </Link>
              <Link href="/cms/dashboard/admin-access" className="button-secondary">
                Sang duyệt admin
              </Link>
            </div>
          </div>

          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="userName">Tên hiển thị</label>
              <input id="userName" defaultValue={user.name} />
            </div>
            <div className="field">
              <label htmlFor="userEmail">Email</label>
              <input id="userEmail" defaultValue={user.email} />
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="userType">Loại tài khoản</label>
                <select id="userType" defaultValue={user.type}>
                  <option>User</option>
                  <option>Artist account</option>
                  <option>Agent</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="userStatus">Trạng thái</label>
                <select id="userStatus" defaultValue={user.status}>
                  <option>Đang hoạt động</option>
                  <option>Tạm khóa</option>
                  <option>Chờ nạp thêm</option>
                  <option>Có bonus chờ nhận</option>
                  <option>Cần rà soát payload</option>
                  <option>Đã xác minh</option>
                </select>
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="userStars">Số sao</label>
                <input id="userStars" defaultValue={user.stars} />
              </div>
              <div className="field">
                <label htmlFor="userPremium">Gói</label>
                <input id="userPremium" defaultValue={user.premium} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="userActivity">Hoạt động nổi bật</label>
              <textarea id="userActivity" defaultValue={user.activity} />
            </div>

            <article className="cms-access-card">
              <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
                <div>
                  <p className="section-eyebrow">Admin Approval</p>
                  <h2>Duyệt cấp admin và stick quyền truy cập</h2>
                </div>
              </div>

              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="adminRequest">Trạng thái cấp admin</label>
                  <select id="adminRequest" defaultValue={user.adminRequest}>
                    <option>Không có</option>
                    <option>Chờ duyệt</option>
                    <option>Đã cấp</option>
                    <option>Từ chối</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="adminRole">Vai trò sau khi cấp</label>
                  <select id="adminRole" defaultValue={user.type === 'Admin' ? 'Admin đầy đủ' : 'Ops giới hạn'}>
                    <option>Admin đầy đủ</option>
                    <option>Ops giới hạn</option>
                    <option>Artist Ops</option>
                    <option>Editorial Ops</option>
                    <option>Finance Ops</option>
                  </select>
                </div>
              </div>

              <div className="cms-permission-grid">
                {cmsPermissionOptions.map((permission) => (
                  <label key={permission} className="cms-permission-chip">
                    <input type="checkbox" defaultChecked={user.accessScope.includes(permission)} />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </article>

            <CmsPortalRoleMapping accountId={id} />

            <div className="cms-inline-actions">
              <button type="button" className="button">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="section-eyebrow">Quick Stats</p>
          <h2>Tóm tắt hành vi</h2>
          <div className="cms-overview-stats cms-overview-stats-2">
            <article className="metric">
              <strong>{user.followedArtists}</strong>
              <span>nghệ sĩ đang follow</span>
            </article>
            <article className="metric">
              <strong>{user.votes}</strong>
              <span>lượt vote</span>
            </article>
          </div>

          <article className="cms-access-card">
            <p className="section-eyebrow">Current Access</p>
            <h2>Phạm vi hiện tại</h2>
            <div className="cms-permission-grid">
              {user.accessScope.length > 0 ? (
                user.accessScope.map((permission) => (
                  <span key={permission} className="cms-permission-chip cms-permission-chip-readonly">
                    {permission}
                  </span>
                ))
              ) : (
                <span className="muted">Tài khoản này chưa được cấp quyền vào CMS.</span>
              )}
            </div>
          </article>
        </article>
      </div>
    </CmsDashboardShell>
  )
}
