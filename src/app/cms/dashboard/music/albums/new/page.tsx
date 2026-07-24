import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicAlbumForm } from '@/components/cms-music-album-form'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { normalizeCmsRole } from '@/lib/cms-role-policy'

export const revalidate = 0

export default async function CmsMusicCreateAlbumPage() {
  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)
  if (!session || normalizeCmsRole(session.role) !== 'super_admin') redirect('/cms/forbidden')

  const payload = await loadPayloadClient()
  const [artistResult, categoryResult, trackResult] = await Promise.all([
    payload.find({ collection: 'artists', sort: 'stageName', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'categories', sort: 'name', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'tracks', sort: '-updatedAt', limit: 500, depth: 0, pagination: false, overrideAccess: true }),
  ])
  const artists = artistResult.docs.map((artist) => ({ id: String(artist.id), name: artist.stageName || artist.slug || 'Unnamed artist', slug: artist.slug || '' }))
  const uploadArtists = artistResult.docs.map((artist) => ({ slug: artist.slug || '', name: artist.stageName || artist.slug || 'Unnamed artist' })).filter((artist) => artist.slug)
  const genres = categoryResult.docs.map((category) => ({ id: String(category.id), slug: category.slug || '', name: category.name || category.slug || 'Uncategorized' })).filter((category) => category.slug)
  const tracks = trackResult.docs
    .filter((track) => track.trackType !== 'album')
    .map((track) => ({
      id: String(track.id),
      title: track.title || 'Untitled track',
      artist: track.submittedArtistSlug || 'No artist assigned',
      type: track.trackType === 'single' ? 'Track' : track.trackType || 'Track',
      duration: track.durationLabel || '00:00',
      musicCode: track.musicCode || '',
    }))

  return (
    <CmsDashboardShell activeKey="music" title="Create Album / EP" description="Create a release, then choose uploaded tracks to group into the Album or EP.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Album Builder</p><h2>Build an Album / EP from uploaded tracks</h2><p className="cms-muted">Use the plus icon to add a track and the minus icon to remove it before saving.</p></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Back to library</Link><Link href="/cms/dashboard/music/upload" className="button-secondary">Upload a track</Link></div>
        </div>
        <CmsMusicAlbumForm artists={artists} uploadArtists={uploadArtists} genres={genres} tracks={tracks} />
      </article>
    </CmsDashboardShell>
  )
}
