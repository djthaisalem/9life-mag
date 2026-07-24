import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicAlbumEditor } from '@/components/cms-music-album-editor'
import { loadPayloadClient } from '@/lib/payload-runtime'

export default async function CmsAlbumEditPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params
  const payload = await loadPayloadClient()
  let album
  try {
    album = await payload.findByID({ collection: 'albums', id: albumId, depth: 1, overrideAccess: true })
  } catch {
    notFound()
  }

  const tracks = await payload.find({ collection: 'tracks', limit: 500, sort: '-updatedAt', depth: 0, pagination: false, overrideAccess: true })
  const initialTrackIds = Array.isArray(album.tracks)
    ? album.tracks.map((track) => typeof track === 'object' && track ? String(track.id) : String(track))
    : []
  const coverUrl = typeof album.coverImage === 'object' && album.coverImage ? album.coverImage.url || '' : ''

  return <CmsDashboardShell activeKey="music" title="Chỉnh sửa Album" description="Cập nhật thông tin Album, cover, trạng thái hiển thị và danh sách track.">
    <div className="cms-booking-tabs"><Link href="/cms/dashboard/music" className="cms-booking-tab">Track</Link><Link href="/cms/dashboard/music/albums" className="cms-booking-tab cms-booking-tab-active">Album</Link></div>
    <article className="panel">
      <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Album editor</p><h2>{album.title}</h2><p className="cms-muted">Lưu thay đổi để cập nhật Album và các track đang thuộc release này.</p></div></div>
      <CmsMusicAlbumEditor
        albumId={String(album.id)}
        initialAlbum={{ title: album.title, description: album.description || '', isPublic: album.isPublic === true, coverUrl }}
        initialTrackIds={initialTrackIds}
        tracks={tracks.docs.filter((track) => track.trackType === 'single').map((track) => ({ id: String(track.id), title: track.title || 'Chưa đặt tên', artist: track.submittedArtistSlug || 'Chưa gắn nghệ sĩ', duration: track.durationLabel || '00:00', musicCode: track.musicCode || '' }))}
      />
    </article>
  </CmsDashboardShell>
}
