import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicUploadForm } from '@/components/cms-music-upload-form'
import { cmsArtistRows, cmsMusicGenreRows, cmsMusicRows } from '@/lib/cms-dashboard-data'

export default function CmsMusicUploadPage() {
  return (
    <CmsDashboardShell activeKey="music" title="Upload nhạc" description="File gốc được xử lý an toàn trên server trước khi tạo bản phát và lưu lên R2.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Music Processing</p><h2>Upload file nhạc mới</h2></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Quay lại thư viện</Link><Link href="/cms/dashboard/music/categories" className="button-secondary">Quản lý thể loại</Link></div>
        </div>
        <CmsMusicUploadForm artists={cmsArtistRows} genres={cmsMusicGenreRows} albums={cmsMusicRows.filter((item) => item.type === 'album')} />
      </article>
    </CmsDashboardShell>
  )
}
