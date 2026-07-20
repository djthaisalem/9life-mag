import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { ArtistAgencyProfileEditor } from '@/components/artist-agency-profile-editor'
import { getArtistAgencyBySlug } from '@/lib/artist-agency-data'

export default async function CmsArtistAgencyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const agency = getArtistAgencyBySlug(slug)
  if (!agency) notFound()
  return <CmsDashboardShell activeKey="artists" title={`Agent: ${agency.name}`} description="Cập nhật profile Agent công khai. Những thay đổi được dùng tại trang Agent và thẻ Agent trong profile nghệ sĩ."><div className="cms-inline-actions"><Link href="/cms/dashboard/artists/agents" className="button-secondary">Quay lại Agent</Link><Link href={`/agent/${agency.slug}`} className="button-secondary">Xem site</Link></div><ArtistAgencyProfileEditor endpoint={`/api/cms/artist-agencies/${agency.slug}`} eyebrow="CMS Agent Profile" /></CmsDashboardShell>
}
