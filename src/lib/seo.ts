import type { Metadata } from 'next'
import { env } from '@/lib/env'

const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL)
const defaultImage = '/footer-9life-stage.png'

function absoluteUrl(value: string) {
  return new URL(value, siteUrl).toString()
}

export function createShareMetadata(input: { title: string; description: string; path: string; image?: string; type?: 'website' | 'article' }): Metadata {
  const url = absoluteUrl(input.path)
  const image = input.image?.trim() || defaultImage
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? 'website',
      locale: 'vi_VN',
      url,
      siteName: '9LIFE MAG',
      title: input.title,
      description: input.description,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
  }
}

export const defaultShareMetadata = createShareMetadata({
  title: '9LIFE MAG | Nightlife, Music & Entertainment',
  description: 'Khám phá tin tức nightlife, hồ sơ nghệ sĩ, âm nhạc, booking và cộng đồng giải trí đêm tại 9Life Mag.',
  path: '/',
})
