import Image from 'next/image'
import Link from 'next/link'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import type { OutletMedia } from '@/components/cms-outlet-profile-builder'
import { loadPayloadClient } from '@/lib/payload-runtime'

type OutletStatus = 'draft' | 'pending_review' | 'published' | 'cancelled'

const tabs: Array<{ key: 'pending' | 'published' | 'cancelled'; label: string }> = [
  { key: 'pending', label: 'Đang chờ duyệt' },
  { key: 'published', label: 'Đã duyệt' },
  { key: 'cancelled', label: 'Huỷ' },
]

function mediaFrom(value: unknown): OutletMedia | null {
  if (!value || typeof value !== 'object') return null
  const media = value as { id?: string | number; url?: string; alt?: string }
  if (!media.id) return null
  return { id: String(media.id), url: `/api/public/media/${media.id}`, alt: media.alt || 'Ảnh outlet' }
}

function statusLabel(status: OutletStatus) {
  return ({ draft: 'Bản nháp', pending_review: 'Chờ duyệt', published: 'Đã duyệt', cancelled: 'Huỷ' })[status]
}

export default async function CmsOutletsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams
  const active = tabs.some((tab) => tab.key === params.status) ? params.status as 'pending' | 'published' | 'cancelled' : 'pending'
  const payload = await loadPayloadClient()
  const result = await payload.find({ collection: 'outlet-profiles', limit: 100, depth: 1, sort: '-updatedAt', overrideAccess: true })
  const outlets = result.docs.filter((outlet) => {
    const status = outlet.status as OutletStatus
    return active === 'pending' ? status === 'draft' || status === 'pending_review' : status === active
  })

  return (
    <CmsDashboardShell activeKey="outlets" title="Quản lý Outlets" description="Bản nháp và profile outlet đều được lưu trong dữ liệu CMS thật. Các outlet mẫu ngoài site chính không xuất hiện ở khu vực vận hành.">
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Outlet Registry</p><h2>Hồ sơ outlet</h2><p className="cms-muted">{outlets.length} outlet trong mục đang xem.</p></div>
          <div className="cms-inline-actions"><Link className="cms-outlet-profile-action" href="/cms/dashboard/outlets/new"><span aria-hidden="true">+</span><span><strong>Tạo profile outlet</strong><small>Lưu nháp và hoàn thiện venue</small></span></Link></div>
        </div>
        <nav className="cms-tab-row" aria-label="Trạng thái outlet">{tabs.map((tab) => <Link key={tab.key} href={`/cms/dashboard/outlets?status=${tab.key}`} className={active === tab.key ? 'cms-tab-active' : ''}>{tab.label}</Link>)}</nav>
        {outlets.length ? <div className="cms-outlet-manage-grid">{outlets.map((outlet) => {
          const cover = mediaFrom(outlet.coverImage)
          const status = outlet.status as OutletStatus
          return <article className="cms-outlet-manage-card" key={outlet.id}><div className="cms-outlet-manage-hero">{cover ? <Image src={cover.url} alt={cover.alt} width={84} height={84} className="cms-outlet-manage-avatar" /> : <span className="cms-outlet-manage-rank">O</span>}<div><strong>{outlet.name}</strong><p>{outlet.city || 'Chưa cập nhật địa phương'}</p></div></div><div className="cms-outlet-manage-meta"><span>{statusLabel(status)}</span><span>{outlet.type || 'Chưa có định vị'}</span><span>{outlet.gallery?.length ?? 0} ảnh gallery</span></div><div className="cms-inline-actions"><Link className="button-secondary" href={`/cms/dashboard/outlets/new?id=${outlet.id}`}>Chỉnh sửa</Link></div></article>
        })}</div> : <p className="cms-empty-state">Chưa có outlet ở trạng thái này. Tạo outlet mới để lưu bản nháp vào CMS.</p>}
      </section>
    </CmsDashboardShell>
  )
}
