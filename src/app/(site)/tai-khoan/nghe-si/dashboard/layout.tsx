import { requireArtistPortalAccess } from '@/lib/artist-portal-access'
import { DashboardSupportAssistant } from '@/components/dashboard-support-assistant'

export default async function ArtistDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireArtistPortalAccess('artist')
  return <>{children}<DashboardSupportAssistant role="artist" /></>
}
