import { TalentManagementDashboard } from '@/components/talent-management-dashboard'
import { requireArtistPortalAccess } from '@/lib/artist-portal-access'

export default async function BookingCoordinatorDashboardPage() {
  const account = await requireArtistPortalAccess('booking')
  return <TalentManagementDashboard role="booking" account={account} />
}
