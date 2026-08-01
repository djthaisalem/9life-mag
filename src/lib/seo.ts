import type { Metadata } from 'next'
import { env } from '@/lib/env'

const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL)
const defaultImage = '/footer-9life-stage.png'

function absoluteUrl(value: string) {
  return new URL(value, siteUrl).toString()
}

export function createShareMetadata(input: { title: string; description: string; path: string; image?: string; type?: 'website' | 'article' }): Metadata {
  const url = absoluteUrl(input.path)
  const image = absoluteUrl(input.image?.trim() || defaultImage)
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
  description: 'Khám phá tin tức nightlife, hồ sơ nghệ sĩ, outlet, âm nhạc, booking và những xu hướng giải trí nổi bật dành cho cộng đồng tại 9LIFE MAG.',
  path: '/',
})

defaultShareMetadata.keywords = [
  '9LIFE MAG',
  'tin tức nightlife',
  'âm nhạc điện tử',
  'nghệ sĩ Việt Nam',
  'DJ Việt Nam',
  'booking nghệ sĩ',
  'đặt bàn nightlife',
  'remix',
  'nonstop',
]
defaultShareMetadata.authors = [{ name: '9LIFE MAG', url: siteUrl }]
defaultShareMetadata.creator = '9LIFE MAG'
defaultShareMetadata.publisher = '9LIFE MAG'
