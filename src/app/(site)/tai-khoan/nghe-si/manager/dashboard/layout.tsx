import { requireArtistPortalAccess } from '@/lib/artist-portal-access'
import { DashboardSupportAssistant } from '@/components/dashboard-support-assistant'

export default async function ManagerDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireArtistPortalAccess('manager')
  return <>{children}<DashboardSupportAssistant role="manager" /></>
}
