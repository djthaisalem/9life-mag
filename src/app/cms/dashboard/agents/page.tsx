import { CmsAgentDirectory } from '@/components/cms-agent-directory'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { listStoredArtistAgencies } from '@/lib/artist-agency-store'
export default async function CmsAgentsPage() { return <CmsDashboardShell activeKey="agents" title="Quản lý Agent" description="Quản lý Agent thật, duyệt public, đình chỉ hoặc hủy và đồng bộ profile với dashboard Agent."><CmsAgentDirectory agencies={await listStoredArtistAgencies()} /></CmsDashboardShell> }
