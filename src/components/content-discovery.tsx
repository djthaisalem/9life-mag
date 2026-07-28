import { ContentDiscoveryClient, type DiscoveryGroup, type DiscoveryItem } from '@/components/content-discovery-client'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { listPublishedArtists } from '@/lib/public-artists'
import { listPublishedOutlets } from '@/lib/public-outlets'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'
import { getPublishedUserPlaylists } from '@/lib/shared-user-playlists'
import { toUrlSlug } from '@/lib/url-slug'

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

type AlbumDocument = {
  id: string | number
  title?: string
  slug?: string
  description?: string
  musician?: string
  coverImage?: MediaValue
  isPublic?: boolean
  status?: string
}

const DEFAULT_MUSIC_COVER = '/images/default-music-cover.png'

function mediaUrl(value: MediaValue) {
  if (typeof value === 'string') return value.startsWith('/') || /^https:\/\//.test(value) ? value : undefined
  // Route every Payload media relation through the public image resolver. It
  // understands both R2 bucket URLs and custom-domain paths.
  if (value?.id) return `/api/public/media/${encodeURIComponent(String(value.id))}`
  return value?.url || undefined
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
    image: mediaUrl(track.coverImage) || DEFAULT_MUSIC_COVER,
    href: `/music/track/${track.id}`,
  }
}

function prioritizeLocation<T>(items: T[], location: string, getLocation: (item: T) => string) {
  if (!location) return items
  const sameLocation = items.filter((item) => normalizeLocation(getLocation(item)) === location)
  return sameLocation.length ? sameLocation : items
}

export async function ContentDiscovery({ current }: ContentDiscoveryProps) {
  try {
    const payload = await loadPayloadClient()
    const [tracksResult, postsResult, albumsResult, userPlaylists, publishedArtists, publishedOutlets] = await Promise.all([
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
      payload.find({
        collection: 'albums',
        where: { and: [{ isPublic: { equals: true } }, { status: { equals: 'published' } }] },
        sort: '-updatedAt',
        limit: 100,
        depth: 1,
        pagination: false,
        overrideAccess: true,
      }),
      getPublishedUserPlaylists(100),
      listPublishedArtists(),
      listPublishedOutlets(),
    ])

    const tracks = tracksResult.docs as TrackDocument[]
    const posts = postsResult.docs as PostDocument[]
    const albums = albumsResult.docs as AlbumDocument[]
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

    const collectionItems: DiscoveryItem[] = [
      ...userPlaylists
        .filter((playlist) => playlist.shareCode !== current?.id)
        .map((playlist) => ({
          id: `playlist-${playlist.shareCode}`,
          label: 'Playlist User nổi bật',
          title: playlist.name,
          meta: `${playlist.items.length} bản nhạc`,
          image: playlist.cover || playlist.items[0]?.cover || DEFAULT_MUSIC_COVER,
          href: `/music/library/${playlist.shareCode}`,
        })),
      ...albums
        .filter((album) => album.slug !== current?.id && Boolean(album.slug || album.title))
        .map((album) => ({
          id: `album-${album.id}`,
          label: 'Album / Release',
          title: album.title || 'Album 9LIFE',
          meta: album.musician || album.description || 'Album mới phát hành',
          image: mediaUrl(album.coverImage) || DEFAULT_MUSIC_COVER,
          href: `/music/album/${toUrlSlug(album.slug || album.title || String(album.id))}`,
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
        image: mediaUrl(post.coverImage) || DEFAULT_MUSIC_COVER,
        href: `/tin-tuc/${post.slug}`,
      }))

    const artists = publishedArtists.map((item) => item.artist)
    const outlets = publishedOutlets.map((item) => item.outlet)
    const currentArtist = current?.kind === 'artist' ? artists.find((artist) => artist.slug === current.id) : undefined
    const currentOutlet = current?.kind === 'outlet' ? outlets.find((outlet) => outlet.slug === current.id) : undefined
    const nearbyLocation = normalizeLocation(currentArtist?.location || currentOutlet?.city)

    const artistItems = current?.kind === 'artist' ? [] : prioritizeLocation(
      artists.filter((artist) => artist.slug !== current?.id),
      nearbyLocation,
      (artist) => artist.location,
    ).map((artist) => ({
      id: `artist-${artist.slug}`,
      label: 'Nghệ sĩ',
      title: artist.name,
      meta: `${artist.role} · ${artist.location}`,
      image: artist.image || DEFAULT_MUSIC_COVER,
      href: `/nghe-si/${artist.slug}`,
    }))

    const outletItems = current?.kind === 'outlet' ? [] : prioritizeLocation(
      outlets.filter((outlet) => outlet.slug !== current?.id),
      nearbyLocation,
      (outlet) => outlet.city,
    ).map((outlet) => ({
      id: `outlet-${outlet.slug}`,
      label: 'Outlet',
      title: outlet.name,
      meta: `${outlet.type} · ${outlet.city}`,
      image: outlet.image || DEFAULT_MUSIC_COVER,
      href: `/dat-ban/${outlet.slug}`,
    }))

    const groups: DiscoveryGroup[] = [
      current?.kind !== 'music' ? { key: 'track', items: musicItems } : null,
      current?.kind !== 'playlist' ? { key: 'collection', items: collectionItems } : null,
      current?.kind !== 'article' ? { key: 'article', items: articleItems } : null,
      current?.kind !== 'artist' ? { key: 'artist', items: artistItems } : null,
      current?.kind !== 'outlet' ? { key: 'outlet', items: outletItems } : null,
    ].filter((group): group is DiscoveryGroup => Boolean(group && group.items.length > 0))

    if (!groups.length) return null

    return <ContentDiscoveryClient groups={groups} />
  } catch (error) {
    console.error('Content discovery query failed', error)
    return null
  }
}
