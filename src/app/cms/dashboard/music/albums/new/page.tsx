import Link from 'next/link'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicAlbumForm } from '@/components/cms-music-album-form'
import { loadPayloadClient } from '@/lib/payload-runtime'

export const revalidate = 0

export default async function CmsMusicCreateAlbumPage() {
  const payload = await loadPayloadClient()
  const [artistResult, trackResult] = await Promise.all([
    payload.find({ collection: 'artists', sort: 'stageName', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'tracks', sort: '-updatedAt', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
  ])
  const artists = artistResult.docs.map((artist) => ({ id: String(artist.id), name: artist.stageName || artist.slug || 'Unnamed artist' }))
  const tracks = trackResult.docs
    .filter((track) => track.trackType !== 'album')
    .map((track) => ({
      id: String(track.id),
      title: track.title || 'Untitled track',
      artist: track.submittedArtistSlug || 'No artist assigned',
      type: track.trackType === 'single' ? 'Track' : track.trackType || 'Track',
      duration: track.durationLabel || '00:00',
    }))

  return (
    <CmsDashboardShell activeKey="music" title="Create Album / EP" description="Create a release, then choose uploaded tracks to group into the Album or EP.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Album Builder</p><h2>Build an Album / EP from uploaded tracks</h2><p className="cms-muted">Use the plus icon to add a track and the minus icon to remove it before saving.</p></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Back to library</Link><Link href="/cms/dashboard/music/upload" className="button-secondary">Upload a track</Link></div>
        </div>
        <CmsMusicAlbumForm artists={artists} tracks={tracks} />
      </article>
    </CmsDashboardShell>
  )
}
