import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { listPublicArticles } from '@/lib/public-articles'
import { listPublishedArtists } from '@/lib/public-artists'
import { listPublishedOutlets } from '@/lib/public-outlets'
import { listStoredArtistAgencies } from '@/lib/artist-agency-store'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPublishedUserPlaylists } from '@/lib/shared-user-playlists'
import { toUrlSlug } from '@/lib/url-slug'

export const revalidate = 3600

type PublicMusicDocument = {
  id: string | number
  slug?: string
  title?: string
  updatedAt?: string
}

async function listPublicMusic() {
  const payload = await loadPayloadClient()
  const [trackResult, albumResult] = await Promise.all([
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
      limit: 1000,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'albums',
      where: { isPublic: { equals: true } },
      sort: '-updatedAt',
      limit: 500,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    }),
  ])

  return {
    tracks: trackResult.docs as PublicMusicDocument[],
    albums: albumResult.docs as PublicMusicDocument[],
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const staticPages = [
    { path: '/', frequency: 'daily', priority: 1 },
    { path: '/tin-tuc', frequency: 'daily', priority: 0.9 },
    { path: '/nghe-si', frequency: 'daily', priority: 0.9 },
    { path: '/music', frequency: 'daily', priority: 0.9 },
    { path: '/music/playlists', frequency: 'daily', priority: 0.8 },
    { path: '/dat-ban', frequency: 'daily', priority: 0.9 },
    { path: '/booking', frequency: 'weekly', priority: 0.8 },
    { path: '/dia-diem', frequency: 'weekly', priority: 0.7 },
    { path: '/music-store', frequency: 'weekly', priority: 0.7 },
    { path: '/lien-he', frequency: 'monthly', priority: 0.5 },
    { path: '/phap-ly/tuyen-bo-ban-quyen', frequency: 'yearly', priority: 0.3 },
    { path: '/phap-ly/chinh-sach-noi-dung', frequency: 'yearly', priority: 0.3 },
    { path: '/phap-ly/chinh-sach-quyen-rieng-tu', frequency: 'yearly', priority: 0.3 },
    { path: '/phap-ly/mien-tru-trach-nhiem', frequency: 'yearly', priority: 0.3 },
  ] as const
  const staticRoutes: MetadataRoute.Sitemap = staticPages.map(({ path, frequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: frequency,
    priority,
  }))

  const [articleResult, artistResult, outletResult, agencyResult, musicResult, playlistResult] = await Promise.allSettled([
    listPublicArticles(),
    listPublishedArtists(),
    listPublishedOutlets(),
    listStoredArtistAgencies(),
    listPublicMusic(),
    getPublishedUserPlaylists(500),
  ])

  const articleRoutes: MetadataRoute.Sitemap = articleResult.status === 'fulfilled'
    ? articleResult.value.map((article) => ({
        url: `${base}/tin-tuc/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []
  const artistRoutes: MetadataRoute.Sitemap = artistResult.status === 'fulfilled'
    ? artistResult.value.map(({ artist }) => ({
        url: `${base}/nghe-si/${artist.slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []
  const outletRoutes: MetadataRoute.Sitemap = outletResult.status === 'fulfilled'
    ? outletResult.value.map(({ outlet }) => ({
        url: `${base}/dat-ban/${outlet.slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []

  const agencyRoutes: MetadataRoute.Sitemap = agencyResult.status === 'fulfilled'
    ? agencyResult.value.filter((agency) => agency.status === 'published').map((agency) => ({
        url: `${base}/agent/${encodeURIComponent(agency.slug)}`,
        lastModified: agency.updatedAt ? new Date(agency.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []
  const trackRoutes: MetadataRoute.Sitemap = musicResult.status === 'fulfilled'
    ? musicResult.value.tracks.map((track) => ({
        url: `${base}/music/track/${encodeURIComponent(String(track.id))}`,
        lastModified: track.updatedAt ? new Date(track.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []
  const albumRoutes: MetadataRoute.Sitemap = musicResult.status === 'fulfilled'
    ? musicResult.value.albums.map((album) => ({
        url: `${base}/music/album/${encodeURIComponent(toUrlSlug(album.slug || album.title || String(album.id)))}`,
        lastModified: album.updatedAt ? new Date(album.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    : []
  const playlistRoutes: MetadataRoute.Sitemap = playlistResult.status === 'fulfilled'
    ? playlistResult.value.map((playlist) => ({
        url: `${base}/music/library/${encodeURIComponent(playlist.shareCode)}`,
        lastModified: new Date(playlist.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))
    : []

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...artistRoutes,
    ...outletRoutes,
    ...agencyRoutes,
    ...trackRoutes,
    ...albumRoutes,
    ...playlistRoutes,
  ]
}
