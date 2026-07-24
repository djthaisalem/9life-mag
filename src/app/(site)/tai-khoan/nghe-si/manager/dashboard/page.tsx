import { TalentManagementDashboard } from '@/components/talent-management-dashboard'
import { requireArtistPortalAccess } from '@/lib/artist-portal-access'

export default async function ManagerDashboardPage() {
  const account = await requireArtistPortalAccess('manager')
  return <TalentManagementDashboard role="manager" account={account} />
}
