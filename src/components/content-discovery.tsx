import Link from 'next/link'

import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPublishedUserPlaylists } from '@/lib/shared-user-playlists'

type DiscoveryKind = 'artist' | 'music' | 'outlet' | 'article' | 'playlist'

type ContentDiscoveryProps = {
  current?: {
    kind: DiscoveryKind
    id?: string
  }
}

type MediaValue = { url?: string | null } | string | null | undefined

type DiscoveryItem = {
  label: string
  title: string
  meta: string
  image?: string
  href: string
}

function mediaUrl(value: MediaValue) {
  if (typeof value === 'string') return value.startsWith('/') || /^https:\/\//.test(value) ? value : undefined
  return value?.url || undefined
}

export async function ContentDiscovery({ current }: ContentDiscoveryProps) {
  try {
    const payload = await loadPayloadClient()
    const [tracks, posts, artists, playlists] = await Promise.all([
      payload.find({
        collection: 'tracks',
        where: {
          and: [
            { visibility: { equals: 'public' } },
            { isPublic: { equals: true } },
            { accessLevel: { not_equals: 'internal' } },
            { previewR2Key: { exists: true } },
          ],
        },
        sort: '-updatedAt',
        limit: 8,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 8,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'artists',
        where: { profileStatus: { equals: 'published' } },
        sort: '-updatedAt',
        limit: 8,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      getPublishedUserPlaylists(8),
    ])

    const track = tracks.docs.find((document) => String(document.id) !== current?.id) as {
      id: string | number
      title?: string
      submittedArtistSlug?: string
      author?: string
      genreLabel?: string
      coverImage?: MediaValue
    } | undefined
    const post = posts.docs.find((document) => String(document.slug) !== current?.id) as {
      slug?: string
      title?: string
      excerpt?: string
      coverImage?: MediaValue
    } | undefined
    const artist = artists.docs.find((document) => String(document.slug) !== current?.id) as {
      slug?: string
      stageName?: string
      role?: string
      serviceArea?: string
      portraitImage?: MediaValue
    } | undefined
    const playlist = playlists.find((document) => document.shareCode !== current?.id)

    const items: DiscoveryItem[] = []
    if (track) {
      items.push({
        label: 'Music',
        title: track.title || '9LIFE Music',
        meta: track.submittedArtistSlug || track.author || track.genreLabel || 'Music mới phát hành',
        image: mediaUrl(track.coverImage),
        href: `/music/track/${track.id}`,
      })
    }
    if (post?.slug) {
      items.push({
        label: 'Tin tức',
        title: post.title || 'Tin mới từ 9LIFE',
        meta: post.excerpt || 'Bài viết mới nhất',
        image: mediaUrl(post.coverImage),
        href: `/tin-tuc/${post.slug}`,
      })
    }
    if (artist?.slug) {
      items.push({
        label: 'Nghệ sĩ',
        title: artist.stageName || 'Hồ sơ nghệ sĩ',
        meta: [artist.role, artist.serviceArea].filter(Boolean).join(' · ') || 'Hồ sơ đã công khai',
        image: mediaUrl(artist.portraitImage),
        href: `/nghe-si/${artist.slug}`,
      })
    }
    if (playlist) {
      items.push({
        label: 'Playlist cộng đồng',
        title: playlist.name,
        meta: `${playlist.items.length} bản nhạc · ${playlist.listens.toLocaleString('vi-VN')} lượt nghe`,
        image: playlist.cover || playlist.items[0]?.cover,
        href: `/music/library/${playlist.shareCode}`,
      })
    }

    if (!items.length) return null

    return (
      <section className="content-discovery" aria-label="Khám phá nội dung liên quan">
        <div className="container">
          <div className="content-discovery-head">
            <div>
              <p className="section-eyebrow">Khám phá thêm</p>
              <h2>Nội dung mới trên 9LIFE</h2>
            </div>
            <p>Chỉ hiển thị nội dung đã công khai và sẵn sàng để người xem tiếp tục khám phá.</p>
          </div>
          <div className="content-discovery-grid">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="content-discovery-card">
                {item.image ? <img src={item.image} alt="" /> : <span className="content-discovery-image-placeholder" aria-hidden="true" />}
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
  } catch (error) {
    console.error('Content discovery query failed', error)
    return null
  }
}
