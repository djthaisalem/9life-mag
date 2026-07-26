import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArtistAgencyProfileEditor } from '@/components/artist-agency-profile-editor'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { getStoredArtistAgency } from '@/lib/artist-agency-store'
export default async function CmsAgentDetailPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const agency = await getStoredArtistAgency(slug); if (!agency) notFound(); return <CmsDashboardShell activeKey="agents" title={`Agent: ${agency.name}`} description="Chỉnh sửa cùng dữ liệu mà dashboard Agent và profile Agent công khai sử dụng."><div className="cms-inline-actions"><Link className="button-secondary" href="/cms/dashboard/agents">Quay lại Agent</Link><Link className="button-secondary" href={`/agent/${agency.slug}`}>Xem site</Link></div><ArtistAgencyProfileEditor endpoint={`/api/cms/artist-agencies/${agency.slug}`} eyebrow="CMS Agent Profile" /></CmsDashboardShell> }
