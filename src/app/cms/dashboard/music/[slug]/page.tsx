import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicEditForm } from '@/components/cms-music-edit-form'
import { cmsArtistRows, cmsMusicGenreRows, cmsMusicRows } from '@/lib/cms-dashboard-data'
import { getCmsMusicLibraryRowBySlug } from '@/lib/cms-music-library'

const displayMapOptions = [
  'Trang chủ - Nonstop picks',
  'Trang chủ - Top Remix',
  'Music - Hero exclusive',
  'Music - DJ sets community',
  'Music - Remix đang lên',
  'Music - Album / release',
  'Music - Artist spotlight',
  'Profile nghệ sĩ',
  'Playlist User nổi bật',
] as const

const accessOptions = [
  { value: 'public', label: 'Công khai - nghe miễn phí' },
  { value: 'stars', label: 'Trừ sao để phát' },
  { value: 'premium', label: 'Chỉ Premium' },
  { value: 'internal', label: 'Chỉ nội bộ CMS' },
] as const

const visibilityOptions = [
  { value: 'draft', label: 'Nháp nội bộ' },
  { value: 'pending', label: 'Chờ admin duyệt' },
  { value: 'public', label: 'Đang public' },
  { value: 'hidden', label: 'Tạm ẩn' },
] as const

export default async function CmsMusicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const music = await getCmsMusicLibraryRowBySlug(slug)
  if (!music) notFound()

  const albums = cmsMusicRows.filter((item) => item.type === 'album')
  const selectedMaps = music.mappedTo.split('/').map((value) => value.trim()).filter(Boolean)

  return (
    <CmsDashboardShell activeKey="music" title={`Sửa nhạc: ${music.title}`} description="Chỉnh sửa metadata, quyền phát, trạng thái public và các vị trí hiển thị của nội dung trên site chính.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Music Detail</p><h2>Thiết lập nội dung phát</h2></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Quay lại danh sách</Link><Link href="/cms/dashboard/music/upload" className="button-secondary">Upload nhạc mới</Link></div>
        </div>

        <CmsMusicEditForm
          music={{
            slug: music.slug,
            title: music.title,
            type: music.trackTypeValue,
            genre: music.genre,
            artistSlug: music.artist,
            access: music.accessLevelValue,
            visibility: music.visibilityValue,
            durationLabel: music.duration,
            playbackStarCost: music.playbackStarCost ?? 0,
            downloadStarCost: music.downloadStarCost ?? 0,
            isDownloadDisabled: music.isDownloadDisabled,
            albumLabel: music.albumLabel ?? '',
            selectedMaps,
            masterR2Key: music.masterR2Key || `r2://music/${music.updatedAt.slice(0, 10)}/${music.slug}.mp3`,
            isDatabaseRecord: music.source === 'database',
          }}
          artists={cmsArtistRows.map((artist) => ({ value: artist.slug, label: artist.name }))}
          genres={cmsMusicGenreRows.map((genre) => ({ value: genre.slug, label: genre.name }))}
          albums={albums.map((album) => ({ value: album.title, label: `${album.title} · ${album.artist}` }))}
          displayMapOptions={displayMapOptions}
          accessOptions={accessOptions}
          visibilityOptions={visibilityOptions}
        />
      </article>
    </CmsDashboardShell>
  )
}
