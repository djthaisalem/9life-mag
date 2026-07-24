import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsStarAnalyticsPanel } from '@/components/cms-star-analytics-panel'
import {
  cmsArtistRows,
  cmsMusicRows,
  cmsOutletRows,
} from '@/lib/cms-dashboard-data'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'
import { getCmsAccessRequests } from '@/lib/cms-access-requests'
import { getSiteStarBalanceSummary, listSiteAccountsForCms } from '@/lib/site-user-session'
import { getWalletLedgerSnapshot } from '@/lib/wallet-ledger'

const workspaceLinks = [
  { href: '/cms/dashboard/articles', label: 'Bài viết', detail: 'Biên tập, chuyên đề và vị trí hiển thị', icon: '✦' },
  { href: '/cms/dashboard/artists', label: 'Nghệ sĩ', detail: 'Hồ sơ, agent và trạng thái duyệt', icon: '◎' },
  { href: '/cms/dashboard/music', label: 'Music', detail: 'Catalog, quyền nghe và phân phối', icon: '♫' },
  { href: '/cms/dashboard/booking', label: 'Booking', detail: 'Yêu cầu nghệ sĩ, đặt bàn và liên hệ', icon: '◫' },
  { href: '/cms/dashboard/outlets', label: 'Outlets', detail: 'Venue, media và cấu hình đặt bàn', icon: '⌂' },
  { href: '/cms/dashboard/stars', label: 'Sao / Thanh toán', detail: 'Đối soát nạp sao và ví thành viên', icon: '✧' },
] as const

const publishChecks = [
  { label: 'Bài viết', detail: 'Kiểm tra cover, chuyên mục, liên kết nội bộ và SEO trước khi xuất bản.', href: '/cms/dashboard/articles' },
  { label: 'Nghệ sĩ', detail: 'Duyệt hồ sơ, quyền sở hữu và liên kết booking trước khi public.', href: '/cms/dashboard/artists' },
  { label: 'Music', detail: 'Xác minh tệp nghe, quyền tải xuống, metadata và vị trí hiển thị.', href: '/cms/dashboard/music' },
] as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsDashboardOverviewPage() {
  const [walletEntries, starBalanceSummary, recentUsers, bookingRows, accessRequests] = await Promise.all([
    getWalletLedgerSnapshot(),
    getSiteStarBalanceSummary(),
    listSiteAccountsForCms({ page: 1, limit: 5 }),
    getBookingRequestsSnapshot(),
    getCmsAccessRequests(),
  ])
  const bookingTotal = bookingRows.length
  const pendingAccess = accessRequests.length
  const pendingArtistProfiles = cmsArtistRows.slice(10).length
  const latestArtistBooking = bookingRows.find((item) => item.type === 'artist')
  const latestOutletBooking = bookingRows.find((item) => item.type === 'outlet')
  const recentActivity = [
    ...(recentUsers.users[0]
      ? [{
          title: 'Tài khoản mới đăng ký',
          detail: `${recentUsers.users[0].name} · ${recentUsers.users[0].email || recentUsers.users[0].phone || 'Chưa có thông tin liên hệ'}`,
          href: `/cms/dashboard/users/${recentUsers.users[0].id}`,
          status: 'Mới',
        }]
      : []),
    ...(latestArtistBooking
      ? [{ title: 'Booking nghệ sĩ mới', detail: `${latestArtistBooking.title} · ${latestArtistBooking.schedule}`, href: '/cms/dashboard/booking/artists', status: 'Cần tiếp nhận' }]
      : []),
    ...(latestOutletBooking
      ? [{ title: 'Đặt bàn mới', detail: `${latestOutletBooking.title} · ${latestOutletBooking.schedule}`, href: '/cms/dashboard/booking/outlets', status: 'Cần xác nhận' }]
      : []),
    { title: 'Duyệt hồ sơ nghệ sĩ', detail: `${pendingArtistProfiles} hồ sơ nháp đã tạo profile, cần admin duyệt trước khi hiển thị trên site`, href: '/cms/dashboard/artists', status: 'Chờ duyệt' },
    { title: 'Yêu cầu phân quyền', detail: `${pendingAccess} tài khoản đang chờ kiểm tra quyền truy cập CMS`, href: '/cms/dashboard/admin-access', status: 'Chờ duyệt' },
  ]

  return (
    <CmsDashboardShell
      activeKey="overview"
      title="Tổng quan vận hành"
      description="Theo dõi tình trạng nội dung, booking, thành viên và các công việc cần xử lý trên toàn bộ hệ thống 9Life."
    >
      <section className="cms-overview-command-bar">
        <div>
          <p className="section-eyebrow">Operations Snapshot</p>
          <h2>Trung tâm điều hành 9Life</h2>
          <p>Ưu tiên các yêu cầu mới, hoàn tất kiểm tra xuất bản và theo dõi sức khỏe của từng khu vực quản trị.</p>
        </div>
        <div className="cms-overview-command-actions">
          <Link href="/cms/dashboard/booking" className="button-secondary">Xem yêu cầu mới</Link>
          <Link href="/cms/dashboard/articles" className="cms-overview-create-article-action">
            <span aria-hidden="true">+</span>
            <span><strong>Tạo bài viết</strong><small>Mở trình biên tập nội dung</small></span>
          </Link>
        </div>
      </section>

      <section className="cms-overview-kpi-grid" aria-label="Chỉ số vận hành">
        <Link href="/cms/dashboard/articles" className="cms-overview-kpi-card"><span>Nội dung đang quản lý</span><strong>128</strong><small>Đã xuất bản và đang biên tập</small></Link>
        <Link href="/cms/dashboard/artists" className="cms-overview-kpi-card"><span>Hồ sơ nghệ sĩ</span><strong>{cmsArtistRows.length}</strong><small>Catalog có thể phân phối trên site</small></Link>
        <Link href="/cms/dashboard/music" className="cms-overview-kpi-card"><span>Nội dung Music</span><strong>{cmsMusicRows.length}</strong><small>Track, nonstop, remix và playlist</small></Link>
        <Link href="/cms/dashboard/booking" className="cms-overview-kpi-card cms-overview-kpi-card-alert"><span>Yêu cầu cần theo dõi</span><strong>{bookingTotal}</strong><small>Booking và đặt bàn mới nhất</small></Link>
      </section>

      <CmsStarAnalyticsPanel
        entries={walletEntries}
        totalBalance={starBalanceSummary.totalBalance}
        userCount={starBalanceSummary.userCount}
        signupIssued={starBalanceSummary.signupIssued}
      />

      <section className="cms-overview-main-grid">
        <article className="panel cms-overview-priority-panel">
          <div className="cms-panel-head-inline">
            <div><p className="section-eyebrow">Priority Queue</p><h2>Việc cần xử lý</h2></div>
            <Link href="/cms/dashboard/booking" className="cms-table-link">Mở Booking</Link>
          </div>
          <div className="cms-overview-priority-list">
            {recentActivity.map((item) => (
              <Link key={item.title} href={item.href} className="cms-overview-priority-item">
                <span className="cms-overview-priority-dot" />
                <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                <em>{item.status}</em>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel cms-overview-health-panel">
          <p className="section-eyebrow">System Health</p>
          <h2>Tình trạng catalog</h2>
          <div className="cms-overview-health-list">
            <div><span>Hồ sơ outlet</span><strong>{cmsOutletRows.length}</strong><small>venue trong danh sách quản lý</small></div>
            <div><span>Thành viên</span><strong>{recentUsers.totalDocs}</strong><small>tài khoản thật trong database</small></div>
            <div><span>Phân quyền chờ duyệt</span><strong>{pendingAccess}</strong><small>cần rà soát phạm vi truy cập</small></div>
          </div>
          <Link href="/cms/dashboard/api" className="cms-overview-security-link">Kiểm tra API và bảo mật <span>→</span></Link>
        </article>
      </section>

      <section className="cms-overview-panels">
        <article className="panel">
          <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Workspaces</p><h2>Đi đến khu quản trị</h2></div></div>
          <div className="cms-overview-workspace-grid">
            {workspaceLinks.map((item) => (
              <Link key={item.href} href={item.href} className="cms-overview-workspace-card">
                <span>{item.icon}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><b>→</b>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Publish Control</p><h2>Điểm kiểm tra trước khi public</h2></div></div>
          <div className="cms-overview-check-list">
            {publishChecks.map((item, index) => (
              <Link key={item.label} href={item.href} className="cms-overview-check-item">
                <span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </CmsDashboardShell>
  )
}
