import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsPortalRoleMapping } from '@/components/cms-portal-role-mapping'
import { getSiteAccountForCms } from '@/lib/site-user-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSiteAccountForCms(id)

  if (!user) notFound()

  return (
    <CmsDashboardShell
      activeKey="users"
      title={`User: ${user.name}`}
      description="Thông tin tài khoản được đọc trực tiếp từ database vận hành."
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
                Phân quyền admin
              </Link>
            </div>
          </div>

          <div className="form-shell cms-embedded-form">
            <div className="field">
              <label>Tên hiển thị</label>
              <input value={user.name} readOnly />
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label>Email</label>
                <input value={user.email || 'Chưa cập nhật'} readOnly />
              </div>
              <div className="field">
                <label>Số điện thoại</label>
                <input value={user.phone || 'Chưa cập nhật'} readOnly />
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label>Loại tài khoản</label>
                <input value={user.accountType === 'artist' ? 'Artist portal' : 'User'} readOnly />
              </div>
              <div className="field">
                <label>Trạng thái</label>
                <input value={user.isActive ? 'Đang hoạt động' : 'Tạm khóa'} readOnly />
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label>Số sao</label>
                <input value={`${user.stars} sao`} readOnly />
              </div>
              <div className="field">
                <label>Gói</label>
                <input value={user.isPremium ? 'Premium' : 'Free'} readOnly />
              </div>
            </div>

            {user.accountType === 'artist' ? <CmsPortalRoleMapping accountId={id} /> : null}
          </div>
        </article>

        <article className="panel">
          <p className="section-eyebrow">Account Status</p>
          <h2>Tóm tắt tài khoản</h2>
          <div className="cms-overview-stats cms-overview-stats-2">
            <article className="metric">
              <strong>{user.followedArtists}</strong>
              <span>nghệ sĩ đang theo dõi</span>
            </article>
            <article className="metric">
              <strong>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</strong>
              <span>ngày tạo tài khoản</span>
            </article>
          </div>
          <article className="cms-access-card">
            <p className="section-eyebrow">Current Access</p>
            <h2>Phạm vi hiện tại</h2>
            <p className="muted">
              {user.role === 'customer'
                ? 'Tài khoản không có quyền truy cập CMS.'
                : `Vai trò CMS hiện tại: ${user.role}.`}
            </p>
          </article>
        </article>
      </div>
    </CmsDashboardShell>
  )
}
