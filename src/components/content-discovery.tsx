import { ContentDiscoveryClient, type DiscoveryGroup, type DiscoveryItem } from '@/components/content-discovery-client'
import { getArtistBySlug, getPublicArtistProfiles } from '@/lib/artist-directory-data'
import { clubOutlets, getOutletBySlug } from '@/lib/club-booking-data'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { repairVietnameseText, repairVietnameseValue } from '@/lib/repair-vietnamese-text'
import { getPublishedUserPlaylists } from '@/lib/shared-user-playlists'

type DiscoveryKind = 'artist' | 'music' | 'outlet' | 'article' | 'playlist'

type ContentDiscoveryProps = {
  current?: {
    kind: DiscoveryKind
    id?: string
  }
}

type MediaValue = { id?: string | number; url?: string | null } | string | null | undefined

type TrackDocument = {
  id: string | number
  title?: string
  trackType?: string
  submittedArtistSlug?: string
  author?: string
  genreLabel?: string
  coverImage?: MediaValue
  displayMap?: string
}

type PostDocument = {
  slug?: string
  title?: string
  excerpt?: string
  coverImage?: MediaValue
}

function mediaUrl(value: MediaValue) {
  if (typeof value === 'string') return value.startsWith('/') || /^https:\/\//.test(value) ? value : undefined
  if (value?.url) return value.url
  return value?.id ? `/api/public/media/${encodeURIComponent(String(value.id))}` : undefined
}

function normalizeLocation(value?: string) {
  return repairVietnameseText(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function trackLabel(trackType?: string) {
  if (trackType === 'nonstop') return 'Nonstop'
  if (trackType === 'remix') return 'Remix'
  return 'Track'
}

function trackItem(track: TrackDocument, label = trackLabel(track.trackType)): DiscoveryItem {
  return {
    id: `track-${track.id}`,
    label,
    title: track.title || '9LIFE Music',
    meta: track.submittedArtistSlug || track.author || track.genreLabel || 'Music mới phát hành',
    image: mediaUrl(track.coverImage),
    href: `/music/track/${track.id}`,
  }
}

export async function ContentDiscovery({ current }: ContentDiscoveryProps) {
  try {
    const payload = await loadPayloadClient()
    const [tracksResult, postsResult, userPlaylists] = await Promise.all([
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
        limit: 100,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 100,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      getPublishedUserPlaylists(100),
    ])

    const tracks = tracksResult.docs as TrackDocument[]
    const posts = postsResult.docs as PostDocument[]
    const currentTrackId = current?.kind === 'music' ? current.id : undefined

    const musicItems = tracks
      .filter((track) => String(track.id) !== currentTrackId)
      .map((track) => trackItem(track))

    const communityItems = tracks
      .filter((track) => (
        String(track.id) !== currentTrackId
        && (track.displayMap || '').split('/').some((map) => map.trim() === 'Music - DJ sets community')
      ))
      .map((track) => trackItem(track, 'DJ set community'))

    const playlistItems: DiscoveryItem[] = [
      ...userPlaylists
        .filter((playlist) => playlist.shareCode !== current?.id)
        .map((playlist) => ({
          id: `playlist-${playlist.shareCode}`,
          label: 'Playlist User nổi bật',
          title: playlist.name,
          meta: `${playlist.items.length} bản nhạc · ${playlist.listens.toLocaleString('vi-VN')} lượt nghe`,
          image: playlist.cover || playlist.items[0]?.cover,
          href: `/music/library/${playlist.shareCode}`,
        })),
      ...communityItems,
    ]

    const articleItems = posts
      .filter((post) => Boolean(post.slug) && post.slug !== current?.id)
      .map((post) => ({
        id: `article-${post.slug}`,
        label: 'Tin tức',
        title: post.title || 'Tin mới từ 9LIFE',
        meta: post.excerpt || 'Bài viết mới nhất',
        image: mediaUrl(post.coverImage),
        href: `/tin-tuc/${post.slug}`,
      }))

    const profileItems: DiscoveryItem[] = []
    if (current?.kind === 'outlet' && current.id) {
      const currentOutlet = repairVietnameseValue(getOutletBySlug(current.id))
      const location = normalizeLocation(currentOutlet?.city)
      if (location) {
        getPublicArtistProfiles()
          .filter((artist) => normalizeLocation(artist.location) === location)
          .forEach((artist) => profileItems.push({
            id: `artist-${artist.slug}`,
            label: `Nghệ sĩ tại ${artist.location}`,
            title: artist.name,
            meta: `${artist.role} · ${artist.genres}`,
            image: artist.image,
            href: `/nghe-si/${artist.slug}`,
          }))
      }
    }

    if (current?.kind === 'artist' && current.id) {
      const currentArtist = getArtistBySlug(current.id)
      const location = normalizeLocation(currentArtist?.location)
      if (location) {
        repairVietnameseValue(clubOutlets)
          .filter((outlet) => normalizeLocation(outlet.city) === location)
          .forEach((outlet) => profileItems.push({
            id: `outlet-${outlet.slug}`,
            label: `Outlet tại ${outlet.city}`,
            title: outlet.name,
            meta: `${outlet.type} · ${outlet.vibe}`,
            image: outlet.image,
            href: `/dat-ban/${outlet.slug}`,
          }))
      }
    }

    const groups: DiscoveryGroup[] = [
      { key: 'music', items: musicItems },
      { key: 'playlist-community', items: playlistItems },
      { key: 'article', items: articleItems },
      { key: current?.kind === 'artist' ? 'outlet-by-location' : 'artist-by-location', items: profileItems },
    ].filter((group) => group.items.length > 0)

    if (!groups.length) return null

    return <ContentDiscoveryClient groups={groups} />
  } catch (error) {
    console.error('Content discovery query failed', error)
    return null
  }
}
