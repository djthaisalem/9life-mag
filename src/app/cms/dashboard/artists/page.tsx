import Link from 'next/link'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CMS_LIST_PAGE_SIZE, CmsListPagination } from '@/components/cms-list-pagination'
import { loadPayloadClient } from '@/lib/payload-runtime'

type ArtistRow = {
  id: string
  slug: string
  name: string
  role: string
  gender: string
  area: string
  status: string
}

export default async function CmsArtistsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams
  let artists: ArtistRow[] = []

  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'artists', sort: '-updatedAt', limit: 1000, depth: 0, pagination: false, overrideAccess: true })
    artists = result.docs.map((item) => {
      const artist = item as Record<string, unknown>
      return {
        id: String(artist.id),
        slug: typeof artist.slug === 'string' ? artist.slug : String(artist.id),
        name: typeof artist.stageName === 'string' ? artist.stageName : 'Chưa đặt tên',
        role: typeof artist.role === 'string' ? artist.role : 'Chưa chọn',
        gender: typeof artist.gender === 'string' ? artist.gender : 'Chưa chọn',
        area: typeof artist.serviceArea === 'string' ? artist.serviceArea : 'Chưa cập nhật',
        status: typeof artist.profileStatus === 'string' ? artist.profileStatus : 'draft',
      }
    })
  } catch (error) {
    console.error('CMS artist registry query failed', error)
  }

  const activeStatus = params.status === 'published' || params.status === 'archived' ? params.status : 'pending_review'
  const filteredArtists = artists.filter((artist) => activeStatus === 'pending_review'
    ? artist.status === 'pending_review' || artist.status === 'draft'
    : artist.status === activeStatus)
  const totalPages = Math.max(1, Math.ceil(filteredArtists.length / CMS_LIST_PAGE_SIZE))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1))
  const visibleArtists = filteredArtists.slice((page - 1) * CMS_LIST_PAGE_SIZE, page * CMS_LIST_PAGE_SIZE)

  return (
    <CmsDashboardShell activeKey="artists" title="Quản lý Nghệ sĩ" description="Chỉ hiển thị hồ sơ nghệ sĩ đã được tạo trong database vận hành. Catalog mẫu trên site chính không xuất hiện tại đây.">
      <section className="cms-panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Artist Registry</p><h2>Hồ sơ nghệ sĩ thực tế</h2><p className="cms-muted">{artists.length ? `Hiển thị ${visibleArtists.length}/${filteredArtists.length} hồ sơ trong nhóm đang chọn.` : 'Chưa có hồ sơ nghệ sĩ nào được tạo trong database.'}</p></div>
          <Link className="cms-artist-catalog-action" href="/cms/dashboard/artists/new"><span aria-hidden="true">+</span><span><strong>Tạo catalog nghệ sĩ</strong><small>Tạo profile mới để chờ duyệt hoặc xuất bản</small></span></Link>
        </div>
        <div className="cms-booking-tabs" role="tablist" aria-label="Trạng thái hồ sơ nghệ sĩ"><Link className={activeStatus === 'pending_review' ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} href="/cms/dashboard/artists?status=pending_review">Đang chờ duyệt</Link><Link className={activeStatus === 'published' ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} href="/cms/dashboard/artists?status=published">Đã duyệt</Link><Link className={activeStatus === 'archived' ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} href="/cms/dashboard/artists?status=archived">Đã hủy</Link></div>
        {visibleArtists.length ? <div className="cms-table-wrap"><table className="cms-table cms-table-artists"><thead><tr><th>STT</th><th>Nghệ sĩ</th><th>Vai trò</th><th>Giới tính</th><th>Khu vực</th><th>Trạng thái</th><th>Xem hồ sơ</th></tr></thead><tbody>{visibleArtists.map((artist, index) => <tr key={artist.id}><td>{String((page - 1) * CMS_LIST_PAGE_SIZE + index + 1).padStart(2, '0')}</td><td><strong>{artist.name}</strong><span>{artist.slug}</span></td><td>{artist.role}</td><td>{artist.gender}</td><td>{artist.area}</td><td><span className="cms-status-chip">{artist.status}</span></td><td><Link className="button-secondary" href={`/cms/dashboard/artists/${artist.slug}`}>Xem hồ sơ</Link></td></tr>)}</tbody></table></div> : <p className="cms-empty-state">Nhóm này chưa có hồ sơ.</p>}
        <CmsListPagination page={page} totalItems={filteredArtists.length} baseHref={`/cms/dashboard/artists?status=${activeStatus}`} />
      </section>
    </CmsDashboardShell>
  )
}
