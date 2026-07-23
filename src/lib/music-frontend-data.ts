import type { AudioTrack } from '@/lib/audio-types'
import type { AudioSourceType } from '@/lib/audio-types'

export const tidalHero = {
  eyebrow: '9Life Select',
  title: 'Music cho cộng đồng nightlife',
  summary: 'Khám phá track, nonstop và remix đã được duyệt từ catalog 9Life Music.',
  cover: '/images/default-music-cover.png',
} as const

export const tidalSidebar = [
  'Trang chủ music',
  'Dành cho bạn',
  'Nonstop',
  'Remix',
  'Album',
  'BXH',
  'Nghệ sĩ',
] as const

type FeaturedMusicItem = {
  title: string
  subtitle: string
  cover: string
}

type AlbumItem = {
  title: string
  artist: string
  cover: string
}

type MixItem = {
  title: string
  meta: string
  cover: string
}

type RemixRailItem = {
  title: string
  artist: string
  plays: string
}

export const tidalFeatured: readonly FeaturedMusicItem[] = []

export const tidalCategories = [
  {
    name: 'Nonstop',
    copy: 'Mix liên tục cho club, lounge và rooftop.',
    accent: 'linear-gradient(135deg, #f5b301, #ffdf72)',
    href: '#listen-now',
  },
  {
    name: 'Remix',
    copy: 'Rework, club edit và phiên bản độc quyền.',
    accent: 'linear-gradient(135deg, #d29b00, #f6c940)',
    href: '#top-remix',
  },
  {
    name: 'Album',
    copy: 'Album và concept release nổi bật.',
    accent: 'linear-gradient(135deg, #9f7400, #f5b301)',
    href: '#albums',
  },
  {
    name: 'Dành cho bạn',
    copy: 'Gợi ý từ thư viện, lượt nghe và gu nhạc của bạn.',
    accent: 'linear-gradient(135deg, #6f4705, #dca61d)',
    href: '#for-you',
  },
] as const

export const tidalAlbums: readonly AlbumItem[] = []
export const tidalMixes: readonly MixItem[] = []
export const tidalRemixRail: readonly RemixRailItem[] = []
export const tidalNonstopTracks: readonly AudioTrack[] = []
export const tidalRemixTracks: readonly AudioTrack[] = []

export type TidalHeroSlide = {
  id: string
  badge: string
  title: string
  subtitle: string
  cover: string
  sourceType: AudioSourceType
  tracks: readonly AudioTrack[]
}

export const tidalHeroSlides: readonly TidalHeroSlide[] = [
  {
    id: 'catalog-ready',
    badge: '9Life Music',
    title: 'Catalog đang cập nhật',
    subtitle: 'Track public mới nhất sẽ tự động xuất hiện sau khi được duyệt trong CMS.',
    cover: '/images/default-music-cover.png',
    sourceType: 'track',
    tracks: [],
  },
]
