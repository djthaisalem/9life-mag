import Link from 'next/link'
import { CmsArtistProfileBuilder } from '@/components/cms-artist-profile-builder'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'

export default function CmsArtistCreatePage() {
  return (
    <CmsDashboardShell
      activeKey="artists"
      title="Tạo Catalog Nghệ sĩ"
      description="Tạo hồ sơ nghệ sĩ đầy đủ theo đúng cấu trúc profile public, vận hành theo luồng nháp, preview và chờ admin duyệt."
    >
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div>
            <p className="section-eyebrow">Artist Catalog Builder</p>
            <h2>Khởi tạo hồ sơ mới trong catalog</h2>
          </div>
          <Link href="/cms/dashboard/artists" className="button-secondary cms-action-nowrap">
            Quay lại danh sách nghệ sĩ
          </Link>
        </div>
      </article>

      <CmsArtistProfileBuilder />
    </CmsDashboardShell>
  )
}
