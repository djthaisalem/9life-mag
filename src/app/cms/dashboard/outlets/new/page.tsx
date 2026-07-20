import Link from 'next/link'
import { CmsOutletProfileBuilder } from '@/components/cms-outlet-profile-builder'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'

export default function CmsOutletCreatePage() {
  return (
    <CmsDashboardShell
      activeKey="outlets"
      title="Tạo Profile Outlet"
      description="Khởi tạo một profile outlet mới với đầy đủ thông tin chuyên nghiệp như ngoài site chính, kèm preview nháp và cấu hình booking riêng."
    >
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">New Outlet Profile</p>
            <h2>Tạo profile outlet mới</h2>
          </div>
          <Link href="/cms/dashboard/outlets" className="button-secondary">
            Quay lại outlets
          </Link>
        </div>
      </article>

      <CmsOutletProfileBuilder />
    </CmsDashboardShell>
  )
}
