import Link from 'next/link'
import { CmsAgentCreateForm } from '@/components/cms-agent-create-form'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
export default function CmsNewAgentPage() { return <CmsDashboardShell activeKey="agents" title="Tạo Agent"><div className="cms-inline-actions"><Link className="button-secondary" href="/cms/dashboard/agents">Quay lại Agent</Link></div><CmsAgentCreateForm /></CmsDashboardShell> }
