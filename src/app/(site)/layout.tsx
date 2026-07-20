import { MediaPlayerProvider } from '@/components/global-media-player'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MediaPlayerProvider>
      <div className="page-shell page-shell-player">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </MediaPlayerProvider>
  )
}
