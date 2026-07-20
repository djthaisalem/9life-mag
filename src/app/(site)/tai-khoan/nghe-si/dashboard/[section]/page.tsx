import { notFound } from 'next/navigation'
import { ArtistBookingDashboard } from '@/components/artist-booking-dashboard'
import { ArtistPortalEditorPage } from '@/components/artist-portal-editor-page'
import { getArtistPortalSection } from '@/lib/artist-portal-sections'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'

type ArtistPortalSectionPageProps = {
  params: Promise<{
    section: string
  }>
}

export default async function ArtistPortalSectionPage({ params }: ArtistPortalSectionPageProps) {
  const { section } = await params
  const currentSection = getArtistPortalSection(section)

  if (!currentSection) {
    notFound()
  }

  if (section === 'booking') {
    const requests = await getBookingRequestsSnapshot()
    const artistRows = requests.filter((request) => request.type === 'artist' && request.href.endsWith('/neon-viper'))
    // Venue requests will be linked to the signed-in artist account when the booking API persists that relationship.
    const venueRows = requests.filter(
      (request) => request.type === 'outlet' && request.submittedFields.some((field) => field.label === 'Artist account' && field.value === 'neon-viper'),
    )

    return <ArtistBookingDashboard artistRows={artistRows} venueRows={venueRows} />
  }

  return <ArtistPortalEditorPage section={currentSection} />
}
