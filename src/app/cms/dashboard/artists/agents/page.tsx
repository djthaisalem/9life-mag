import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { getArtistAgencies } from '@/lib/artist-agency-data'

export default function CmsArtistAgenciesPage() {
  const agencies = getArtistAgencies()
  return <CmsDashboardShell activeKey="artists" title="Quản lý Agent" description="Quản lý nội dung trang public của từng Agent và theo dõi đơn vị đang đại diện cho các profile nghệ sĩ."><section className="cms-panel"><div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Artist Agencies</p><h2>Danh sách đơn vị quản lý</h2><p className="cms-muted">Chọn một Agent để cập nhật mô tả, cover, phạm vi hoạt động, thế mạnh và dịch vụ.</p></div><Link className="button-secondary" href="/cms/dashboard/artists">Quay lại nghệ sĩ</Link></div><div className="cms-table-wrap"><table className="cms-table"><thead><tr><th>Agent</th><th>Định vị</th><th>Khu vực</th><th>Phạm vi</th><th>Thao tác</th></tr></thead><tbody>{agencies.map((agency) => <tr key={agency.slug}><td><strong>{agency.name}</strong><span>{agency.slug}</span></td><td>{agency.label}</td><td>{agency.location}</td><td>{agency.coverage}</td><td><div className="cms-table-actions"><Link className="cms-table-link" href={`/cms/dashboard/artists/agents/${agency.slug}`}>Chỉnh sửa</Link><Link className="cms-table-link" href={`/agent/${agency.slug}`}>Xem site</Link></div></td></tr>)}</tbody></table></div></section></CmsDashboardShell>
}
