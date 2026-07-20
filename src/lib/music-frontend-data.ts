import type { AudioTrack } from '@/components/audio-showcase-player'
import type { AudioSourceType } from '@/lib/audio-types'

export const tidalHero = {
  eyebrow: '9Life Select',
  title: 'Music cho cộng đồng nightlife',
  summary:
    'Frontend public theo hướng streaming app: gọn, đậm, ưu tiên show thật nhiều playlist, album và track.',
  cover: '/music-legacy/bg/21.jpg'
} as const

export const tidalSidebar = [
  'Trang chủ music',
  'Dành cho bạn',
  'Nonstop',
  'Remix',
  'Album',
  'BXH',
  'Nghệ sĩ'
] as const

export const tidalFeatured = [
  {
    title: 'After Dark Essentials',
    subtitle: 'Playlist biên tập cho DJ set',
    cover: '/music-legacy/bg/14.jpg'
  },
  {
    title: 'Remix Radar',
    subtitle: 'Top remix đang được yêu thích',
    cover: '/music-legacy/bg/21.jpg'
  },
  {
    title: '9Life Community Picks',
    subtitle: 'Track do cộng đồng chọn',
    cover: '/music-legacy/bg/14.jpg'
  },
  {
    title: 'Night Transit',
    subtitle: 'Album spotlight tuần này',
    cover: '/music-legacy/bg/21.jpg'
  }
] as const

export const tidalCategories = [
  {
    name: 'Nonstop',
    copy: 'Mix liên tục cho club, lounge, rooftop.',
    accent: 'linear-gradient(135deg, #f5b301, #ffdf72)',
    href: '#listen-now'
  },
  {
    name: 'Remix',
    copy: 'Rework, club edit và phiên bản độc quyền.',
    accent: 'linear-gradient(135deg, #d29b00, #f6c940)',
    href: '#top-remix'
  },
  {
    name: 'Album',
    copy: 'Album và concept release nổi bật.',
    accent: 'linear-gradient(135deg, #9f7400, #f5b301)',
    href: '#albums'
  },
  {
    name: 'Dành cho bạn',
    copy: 'Gợi ý từ thư viện, lượt nghe và gu nhạc của bạn.',
    accent: 'linear-gradient(135deg, #6f4705, #dca61d)',
    href: '#for-you'
  }
] as const

export const tidalAlbums = [
  {
    title: 'Water Lily Club Remix',
    artist: 'Luna Flux x Neon Viper',
    cover: '/music-legacy/bg/21.jpg'
  },
  {
    title: 'Water Lily Intro Mix',
    artist: '9Life Legacy Session',
    cover: '/music-legacy/bg/14.jpg'
  },
  {
    title: 'Saigon Neon Edit',
    artist: 'Ghost Frequency',
    cover: '/music-legacy/bg/21.jpg'
  },
  {
    title: 'Gold Pulse Ride',
    artist: '9Life Rooftop Unit',
    cover: '/music-legacy/bg/14.jpg'
  }
] as const

export const tidalMixes = [
  {
    title: 'Water Lily Intro Mix',
    meta: '2h 15m · Mixed live',
    cover: '/music-legacy/bg/14.jpg'
  },
  {
    title: 'Rooftop Pulse',
    meta: '1h 48m · Peak hour energy',
    cover: '/music-legacy/bg/21.jpg'
  },
  {
    title: 'Late Checkpoint',
    meta: '57m · Warm-up set',
    cover: '/music-legacy/bg/14.jpg'
  }
] as const

export const tidalRemixRail = [
  {
    title: 'Water Lily Club Remix',
    artist: 'Luna Flux x Neon Viper',
    plays: '48K plays'
  },
  {
    title: 'After Hours Rework',
    artist: 'Ghost Frequency',
    plays: '36K plays'
  },
  {
    title: 'Saigon Neon Edit',
    artist: '9Life Community Lab',
    plays: '28K plays'
  }
] as const

export const tidalNonstopTracks: readonly AudioTrack[] = [
  {
    id: 'tidal-nonstop-1',
    title: 'Water Lily Intro Mix',
    artist: '9Life Legacy Session',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '8.4K'
  },
  {
    id: 'tidal-nonstop-2',
    title: 'Rooftop Pulse',
    artist: 'Mixed by Neon Viper',
    duration: '04:45',
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '6.1K'
  },
  {
    id: 'tidal-nonstop-3',
    title: 'Downtown Bounce',
    artist: 'Curated by 9Life',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '5.8K'
  },
  {
    id: 'tidal-nonstop-4',
    title: 'Gold Pulse Ride',
    artist: '9Life Rooftop Unit',
    duration: '04:45',
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '5.2K'
  },
  {
    id: 'tidal-nonstop-5',
    title: 'Late Checkpoint',
    artist: 'Neon Viper',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '4.9K'
  },
  {
    id: 'tidal-nonstop-6',
    title: 'Sunrise Return',
    artist: 'Luna Flux',
    duration: '04:45',
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '4.3K'
  },
  {
    id: 'tidal-nonstop-7',
    title: 'Clubline Express',
    artist: '9Life Community Lab',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '4.0K'
  },
  {
    id: 'tidal-nonstop-8',
    title: 'Neon Freeway',
    artist: 'Mixed by Neon Viper',
    duration: '04:45',
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '3.8K'
  }
] as const

export const tidalRemixTracks: readonly AudioTrack[] = [
  {
    id: 'tidal-remix-1',
    title: 'Water Lily Club Remix',
    artist: 'Luna Flux x Neon Viper',
    duration: '04:45',
    likes: '11.2K',
    downloads: 4218,
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-2',
    title: 'After Hours Rework',
    artist: 'Ghost Frequency',
    duration: '04:45',
    likes: '9.5K',
    downloads: 3160,
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-3',
    title: 'Saigon Neon Edit',
    artist: '9Life Community Lab',
    duration: '04:45',
    likes: '7.9K',
    downloads: 2489,
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-4',
    title: 'Club Gold Refix',
    artist: 'Neon Viper x Ghost Frequency',
    duration: '04:45',
    likes: '6.8K',
    downloads: 2130,
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-5',
    title: 'Nightcall Edit',
    artist: 'Luna Flux',
    duration: '04:45',
    likes: '5.9K',
    downloads: 1804,
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-6',
    title: 'Afterglow Vocal Flip',
    artist: 'Echo Violet',
    duration: '04:45',
    likes: '5.4K',
    downloads: 1640,
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  },
  {
    id: 'tidal-remix-7',
    title: 'Warehouse Echo Edit',
    artist: 'Ghost Frequency x 9Life Lab',
    duration: '04:45',
    likes: '4.8K',
    downloads: 1438,
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  }
] as const

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
    id: 'hero-slide-1',
    badge: '9Life Exclusive',
    title: 'Water Lily Intro Mix',
    subtitle: 'Nonstop mở màn cho club culture và energy set đêm.',
    cover: '/music-legacy/bg/21.jpg',
    sourceType: 'nonstop',
    tracks: tidalNonstopTracks.slice(0, 4)
  },
  {
    id: 'hero-slide-2',
    badge: 'Peak Hour',
    title: 'Downtown Bounce',
    subtitle: 'Bộ nonstop dày năng lượng cho khung giờ cao điểm.',
    cover: '/music-legacy/bg/14.jpg',
    sourceType: 'nonstop',
    tracks: tidalNonstopTracks.slice(2, 6)
  },
  {
    id: 'hero-slide-3',
    badge: 'Top Remix',
    title: 'Water Lily Club Remix',
    subtitle: 'Track remix nổi bật đang kéo nhiều lượt nghe và download.',
    cover: '/music-legacy/bg/21.jpg',
    sourceType: 'remix',
    tracks: tidalRemixTracks.slice(0, 3)
  },
  {
    id: 'hero-slide-4',
    badge: 'Community Pick',
    title: 'After Hours Rework',
    subtitle: 'Bản edit được cộng đồng 9Life giữ crowd rất tốt.',
    cover: '/music-legacy/bg/14.jpg',
    sourceType: 'remix',
    tracks: tidalRemixTracks.slice(1, 5)
  },
  {
    id: 'hero-slide-5',
    badge: 'Sunrise Session',
    title: 'Late Checkpoint',
    subtitle: 'Mood nhẹ hơn cho rooftop, opening và late transition.',
    cover: '/music-legacy/bg/21.jpg',
    sourceType: 'nonstop',
    tracks: tidalNonstopTracks.slice(4, 8)
  }
] as const
