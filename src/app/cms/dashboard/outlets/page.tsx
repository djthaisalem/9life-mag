import Link from 'next/link'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'

export default async function CmsOutletsPage() {
  const requests = await getBookingRequestsSnapshot()
  const outlets = [...new Map(requests.filter((item) => item.type === 'outlet').map((item) => [item.href, item])).values()]

  return (
    <CmsDashboardShell activeKey="outlets" title="Quản lý Outlets" description="Chỉ hiển thị outlet đã phát sinh dữ liệu booking thật. Club mẫu ở site chính không được dùng trong khu vận hành.">
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Outlet Registry</p><h2>Outlet từ dữ liệu vận hành</h2><p className="cms-muted">{outlets.length ? `${outlets.length} outlet có booking thực tế.` : 'Chưa có outlet nào có dữ liệu booking thực tế.'}</p></div>
          <div className="cms-inline-actions"><Link className="button-secondary" href="/cms/dashboard/booking/outlets">Xem booking</Link><Link className="cms-outlet-profile-action" href="/cms/dashboard/outlets/new"><span aria-hidden="true">+</span><span><strong>Tạo profile outlet</strong><small>Khởi tạo venue và cấu hình đặt bàn</small></span></Link></div>
        </div>
        {outlets.length ? <div className="cms-outlet-manage-grid">{outlets.map((outlet, index) => <article className="cms-outlet-manage-card" key={outlet.href}><div className="cms-outlet-manage-hero"><span className="cms-outlet-manage-rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{outlet.title}</strong><p>{outlet.location}</p></div></div><div className="cms-outlet-manage-meta"><span>Booking thực tế</span><span>{outlet.schedule}</span><span>{outlet.status}</span></div><div className="cms-inline-actions"><Link className="button-secondary" href="/cms/dashboard/booking/outlets">Xem booking</Link></div></article>)}</div> : <p className="cms-empty-state">Chưa có outlet thực tế. Tạo profile outlet và ghi nhận booking đầu tiên để bắt đầu danh sách vận hành.</p>}
      </section>
    </CmsDashboardShell>
  )
}
