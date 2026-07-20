import Link from 'next/link'
import { CmsTopbar } from '@/components/cms-topbar'
import { CmsTextRepair } from '@/components/cms-text-repair'
import { cmsSidebarLinks } from '@/lib/cms-dashboard-data'

const cmsSidebarLabelMap: Record<(typeof cmsSidebarLinks)[number]['key'], string> = {
  overview: 'Tổng quan', articles: 'Bài viết', users: 'Quản lý user', 'admin-access': 'Phân quyền admin',
  artists: 'Nghệ sĩ', music: 'Music', booking: 'Booking', students: 'Học viên', outlets: 'Outlets', stars: 'Sao / Thanh toán', referrals: 'Referral', api: 'API / Bảo mật',
}

export function CmsDashboardShell({ activeKey, title, description, children }: {
  activeKey: (typeof cmsSidebarLinks)[number]['key']; title: string; description?: string; children: React.ReactNode
}) {
  return <div className="cms-shell"><CmsTextRepair /><CmsTopbar /><main className="cms-page cms-app-page"><div className="cms-app-shell">
    <aside className="cms-sidebar">
      <div className="cms-sidebar-brand"><span className="cms-sidebar-dot" /><strong>9Life CMS</strong></div>
      <nav className="cms-sidebar-nav">{cmsSidebarLinks.map((item) => <Link key={item.key} href={item.href} className={item.key === activeKey ? 'cms-sidebar-link cms-sidebar-link-active' : 'cms-sidebar-link'}>{cmsSidebarLabelMap[item.key]}</Link>)}</nav>
      <div className="cms-sidebar-card"><span>Core Control</span><p>Đây là nơi điều phối nội dung, user, nghệ sĩ, music, booking, outlet, sao và các cấu hình vận hành của hệ thống.</p></div>
      <div className="cms-sidebar-card"><span>Workspace</span><p>{description ?? 'Mỗi menu là một workspace riêng để xem dữ liệu rõ ràng, thao tác nhanh và chỉnh trực tiếp đúng lĩnh vực cần quản lý.'}</p></div>
    </aside>
    <section className="cms-content"><section className="cms-workspace-section"><div className="cms-workspace-head"><div><p className="section-eyebrow">CMS Workspace</p><h1 className="page-title">{title}</h1>{description ? <p className="page-intro">{description}</p> : null}</div></div>{children}</section></section>
  </div></main></div>
}
