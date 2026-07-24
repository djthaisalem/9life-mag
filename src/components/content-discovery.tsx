import Link from 'next/link'

import { artistProfiles } from '@/lib/artist-directory-data'
import { clubOutlets } from '@/lib/club-booking-data'
import { nonstopTracks, remixTracks } from '@/lib/music-store-data'
import { newsCatalogSupplement } from '@/lib/news-catalog-supplement'

type DiscoveryKind = 'artist' | 'music' | 'outlet' | 'article' | 'playlist'

type ContentDiscoveryProps = {
  current?: {
    kind: DiscoveryKind
    id?: string
  }
}

export function ContentDiscovery({ current }: ContentDiscoveryProps) {
  const track = [...nonstopTracks, ...remixTracks].find((item) => String(item.id) !== current?.id) ?? nonstopTracks[0]
  const article = newsCatalogSupplement.find((item) => item.slug !== current?.id) ?? newsCatalogSupplement[0]
  const artist = artistProfiles.find((item) => item.slug !== current?.id) ?? artistProfiles[0]
  const outlet = clubOutlets.find((item) => item.slug !== current?.id) ?? clubOutlets[0]

  const items = [
    track && { label: 'Music', title: track.title, meta: track.artist, image: track.cover || '/images/default-music-cover.png', href: `/music/track/${track.id}` },
    article && { label: 'Tin tức', title: article.title, meta: article.category, image: article.image, href: `/tin-tuc/${article.slug}` },
    artist && { label: 'Nghệ sĩ', title: artist.name, meta: artist.role, image: artist.image, href: `/nghe-si/${artist.slug}` },
    outlet && { label: 'Outlet', title: outlet.name, meta: `${outlet.city} · ${outlet.vibe}`, image: outlet.image, href: `/dat-ban/${outlet.slug}` },
  ].filter(Boolean) as Array<{ label: string; title: string; meta: string; image: string; href: string }>

  return (
    <section className="content-discovery" aria-label="Khám phá nội dung liên quan">
      <div className="container">
        <div className="content-discovery-head">
          <div>
            <p className="section-eyebrow">Khám phá thêm</p>
            <h2>Nội dung liên quan trên 9LIFE</h2>
          </div>
          <p>Từ âm nhạc, nghệ sĩ đến nightlife - tiếp tục theo đúng mạch bạn đang quan tâm.</p>
        </div>
        <div className="content-discovery-grid">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="content-discovery-card">
              <img src={item.image} alt="" />
              <div>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
