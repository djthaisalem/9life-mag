import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsArtistRows, cmsMusicGenreRows, cmsMusicRows, getCmsMusicBySlug } from '@/lib/cms-dashboard-data'

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

const visibilityOptions = ['Nháp nội bộ', 'Chờ admin duyệt', 'Đang public', 'Tạm ẩn'] as const

export default async function CmsMusicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const music = getCmsMusicBySlug(slug)
  if (!music) notFound()

  const albums = cmsMusicRows.filter((item) => item.type === 'album')
  const isAlbum = music.type === 'album'
  const selectedMaps = music.mappedTo.split('/').map((value) => value.trim().toLocaleLowerCase('vi-VN'))

  return (
    <CmsDashboardShell activeKey="music" title={`Sửa nhạc: ${music.title}`} description="Chỉnh sửa metadata, quyền phát, trạng thái public và các vị trí hiển thị của nội dung trên site chính.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Music Detail</p><h2>Thiết lập nội dung phát</h2></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Quay lại danh sách</Link><Link href="/cms/dashboard/music/upload" className="button-secondary">Upload nhạc mới</Link></div>
        </div>

        <form className="form-shell cms-embedded-form">
          <div className="field"><label htmlFor="musicTitle">Tên nội dung</label><input id="musicTitle" defaultValue={music.title} /></div>
          <div className="cms-form-two">
            <div className="field"><label htmlFor="musicType">Loại nội dung</label><select id="musicType" defaultValue={music.type}><option value="track">Track</option><option value="nonstop">Nonstop</option><option value="remix">Remix</option><option value="playlist">Playlist</option><option value="album">Album / EP</option></select></div>
            <div className="field"><label htmlFor="musicGenre">Thể loại</label><select id="musicGenre" defaultValue={music.genre}>{cmsMusicGenreRows.map((genre) => <option key={genre.id} value={genre.name}>{genre.name}</option>)}</select></div>
          </div>
          <div className="cms-form-two">
            <div className="field"><label htmlFor="musicArtist">Nghệ sĩ</label><select id="musicArtist" defaultValue={music.artist}><option value="">Để trống nếu chưa gắn nghệ sĩ</option>{cmsArtistRows.map((artist) => <option key={artist.slug} value={artist.name}>{artist.name}</option>)}</select></div>
            <div className="field"><label htmlFor="musicAccess">Quyền truy cập</label><select id="musicAccess" defaultValue={music.access.includes('Premium') ? 'premium' : music.access.includes('sao') || music.access.includes('Sao') ? 'stars' : music.access.includes('nội bộ') ? 'internal' : 'public'}>{accessOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          </div>
          <div className="cms-form-two">
            <div className="field"><label htmlFor="musicVisibility">Hiển thị</label><select id="musicVisibility" defaultValue={music.visibility.includes('public') ? 'Đang public' : music.visibility.includes('rà soát') ? 'Chờ admin duyệt' : music.visibility.includes('ẩn') ? 'Tạm ẩn' : 'Nháp nội bộ'}>{visibilityOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
            <div className="field"><label htmlFor="musicDuration">Thời lượng</label><input id="musicDuration" defaultValue={music.duration} readOnly={isAlbum} /><span className="cms-muted">{isAlbum ? 'Album hiển thị số track; thời lượng nằm ở từng track.' : 'Tự đọc từ file khi upload.'}</span></div>
          </div>
          <div className="cms-form-two">
            <div className="field"><label htmlFor="playbackStarCost">Sao để nghe</label><input id="playbackStarCost" type="number" min="0" step="1" defaultValue={music.playbackStarCost ?? 0} /><span className="cms-muted">Mặc định 0. Chỉ trừ sao khi admin nhập số lớn hơn 0.</span></div>
            <div className="field"><label htmlFor="downloadStarCost">Sao để tải</label><input id="downloadStarCost" type="number" min="0" step="1" defaultValue={music.downloadStarCost ?? 0} /><span className="cms-muted">Mặc định 0. Mức này áp dụng khi user tải file master.</span></div>
          </div>

          {!isAlbum ? <div className="field"><label htmlFor="musicAlbum">Gắn vào Album / EP</label><select id="musicAlbum" defaultValue=""><option value="">Không thuộc album</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.title} · {album.artist}</option>)}</select><span className="cms-muted">Upload từng track trước, sau đó chọn album ở đây để đưa track vào release tương ứng.</span></div> : <div className="cms-security-panel"><strong>Album / EP là một release container</strong><p>Không upload một file MP3 cho Album. Hãy upload từng track, sau đó mở từng track và chọn “Gắn vào Album / EP” để tập hợp danh sách phát hành.</p></div>}

          <fieldset className="cms-map-fieldset"><legend>Map hiển thị trên site</legend><p>Tick các khu vực được phép hiển thị nội dung này.</p><div className="cms-map-option-grid">{displayMapOptions.map((option) => <label key={option}><input type="checkbox" defaultChecked={selectedMaps.some((selected) => option.toLocaleLowerCase('vi-VN').includes(selected) || selected.includes(option.toLocaleLowerCase('vi-VN')))} />{option}</label>)}</div></fieldset>
          <div className="field"><label htmlFor="musicSource">Nguồn file / R2 key</label><input id="musicSource" defaultValue={`r2://music/${music.updatedAt.slice(0, 10)}/${music.slug}.mp3`} /></div>
          <div className="cms-inline-actions"><button type="button" className="button">Lưu thay đổi</button><button type="button" className="button-secondary">Lưu nháp</button></div>
        </form>
      </article>
    </CmsDashboardShell>
  )
}
