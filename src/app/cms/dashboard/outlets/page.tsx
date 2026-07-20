import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { clubOutlets } from '@/lib/club-booking-data'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

const visibleOutlets = clubOutlets.slice(0, 20)

export default function CmsOutletsPage() {
  return (
    <CmsDashboardShell
      activeKey="outlets"
      title="Quản lý Outlets"
      description="Quản lý outlet, hình ảnh, thông tin venue và cấu hình booking hiển thị trên site chính."
    >
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Outlet Registry</p>
            <h2>Danh sách outlet hiện có</h2>
            <p className="cms-muted">Hiển thị {visibleOutlets.length}/{clubOutlets.length} outlet gần nhất.</p>
          </div>
          <div className="cms-inline-actions">
            <Link className="button-secondary" href="/cms/dashboard/booking/outlets">Xem booking</Link>
            <Link className="cms-outlet-profile-action" href="/cms/dashboard/outlets/new">
              <span aria-hidden="true">+</span>
              <span>
                <strong>Tạo profile outlet</strong>
                <small>Thêm venue, hình ảnh và cấu hình đặt bàn</small>
              </span>
            </Link>
          </div>
        </div>
        <div className="cms-outlet-manage-grid">
          {visibleOutlets.map((outlet, index) => (
            <article className="cms-outlet-manage-card" key={outlet.slug}>
              <div className="cms-outlet-manage-hero">
                <span className="cms-outlet-manage-rank">{String(index + 1).padStart(2, '0')}</span>
                <img className="cms-outlet-manage-avatar" src={outlet.image} alt="" />
                <div><strong>{outlet.name}</strong><p>{repairVietnameseText(outlet.city)} • {repairVietnameseText(outlet.regionLabel)}</p></div>
              </div>
              <div className="cms-outlet-manage-meta">
                <span>{repairVietnameseText(outlet.type)}</span>
                <span>{repairVietnameseText(outlet.hours)}</span>
                <span>{index < 6 ? 'Đang public' : 'Nháp nội bộ'}</span>
              </div>
              <div className="cms-inline-actions">
                <Link className="button-secondary" href={`/cms/dashboard/outlets/${outlet.slug}`}>Edit profile</Link>
                <Link className="button-secondary" href={`/cms/dashboard/booking/outlets?outlet=${outlet.slug}`}>Xem booking</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </CmsDashboardShell>
  )
}
