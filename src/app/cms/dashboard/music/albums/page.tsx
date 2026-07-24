import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { loadPayloadClient } from '@/lib/payload-runtime'

export default async function CmsAlbumsPage() {
  const payload = await loadPayloadClient()
  const albums = await payload.find({ collection: 'albums', limit: 500, sort: '-updatedAt', depth: 0, pagination: false, overrideAccess: true })
  return <CmsDashboardShell activeKey="music" title="Quản lý Album"><div className="cms-booking-tabs"><Link href="/cms/dashboard/music" className="cms-booking-tab">Track</Link><Link href="/cms/dashboard/music/albums" className="cms-booking-tab cms-booking-tab-active">Album</Link></div><section className="cms-panel"><div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Album library</p><h2>Tất cả Album / EP</h2></div><Link href="/cms/dashboard/music/albums/new" className="button">Tạo Album / EP</Link></div><div className="cms-table-wrap"><table className="cms-table"><thead><tr><th>Album</th><th>Track</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{albums.docs.map((album) => <tr key={album.id}><td><strong>{album.title}</strong><span>{album.description || 'Chưa có mô tả'}</span></td><td>{Array.isArray(album.tracks) ? album.tracks.length : 0}</td><td>{album.isPublic ? 'Public' : 'Nháp'}</td><td><Link className="cms-table-link" href={`/cms/dashboard/music/albums/${album.id}`}>Chỉnh sửa</Link></td></tr>)}</tbody></table></div></section></CmsDashboardShell>
}
