import Link from 'next/link'
import { CmsNotificationCenter } from '@/components/cms-notification-center'

export function CmsTopbar() {
  return (
    <header className="cms-topbar">
      <div className="container cms-topbar-row">
        <div>
          <p className="cms-topbar-kicker">9LIFE MAG CMS</p>
          <strong>Control Room</strong>
        </div>
        <nav className="cms-topbar-nav">
          <CmsNotificationCenter />
          <Link href="/cms">Đăng nhập</Link>
          <Link href="/cms/dashboard">Dashboard</Link>
          <Link href="/api/cms/session/logout">Đăng xuất</Link>
          <Link href="/">Quay lại site</Link>
        </nav>
      </div>
    </header>
  )
}
