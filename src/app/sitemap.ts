import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return ['/', '/tin-tuc', '/nghe-si', '/music', '/dat-ban'].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === '/tin-tuc' ? 'daily' : 'weekly', priority: path === '/' ? 1 : 0.8 }))
}
