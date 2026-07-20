import { requireArtistPortalAccess } from '@/lib/artist-portal-access'
import { DashboardSupportAssistant } from '@/components/dashboard-support-assistant'

export default async function BookingDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireArtistPortalAccess('booking')
  return <>{children}<DashboardSupportAssistant role="booking" /></>
}
