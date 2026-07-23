import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsMusicUploadForm } from '@/components/cms-music-upload-form'
import { createCmsCapabilityToken } from '@/lib/cms-capability'
import { cmsArtistRows, cmsMusicGenreRows, cmsMusicRows } from '@/lib/cms-dashboard-data'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'

export default async function CmsMusicUploadPage() {
  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)
  if (!session) redirect('/cms')

  const uploadCapability = createCmsCapabilityToken({
    email: session.email,
    role: session.role,
    scope: 'music',
  })

  return (
    <CmsDashboardShell activeKey="music" title="Upload nhạc" description="File gốc được xử lý an toàn trên server trước khi tạo bản phát và lưu lên R2.">
      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Music Processing</p><h2>Upload file nhạc mới</h2></div>
          <div className="cms-inline-actions"><Link href="/cms/dashboard/music" className="button-secondary">Quay lại thư viện</Link><Link href="/cms/dashboard/music/categories" className="button-secondary">Quản lý thể loại</Link></div>
        </div>
        <CmsMusicUploadForm artists={cmsArtistRows} genres={cmsMusicGenreRows} albums={cmsMusicRows.filter((item) => item.type === 'album')} uploadCapability={uploadCapability} />
      </article>
    </CmsDashboardShell>
  )
}
