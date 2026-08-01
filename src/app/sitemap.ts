import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { listPublicArticles } from '@/lib/public-articles'
import { listPublishedArtists } from '@/lib/public-artists'
import { listPublishedOutlets } from '@/lib/public-outlets'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const staticRoutes: MetadataRoute.Sitemap = ['/', '/tin-tuc', '/nghe-si', '/music', '/dat-ban'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/tin-tuc' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }))

  const [articleResult, artistResult, outletResult] = await Promise.allSettled([
    listPublicArticles(),
    listPublishedArtists(),
    listPublishedOutlets(),
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

  return [...staticRoutes, ...articleRoutes, ...artistRoutes, ...outletRoutes]
}
