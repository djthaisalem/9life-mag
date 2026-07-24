'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, Eye, Gem, Medal, Star, Trophy } from 'lucide-react'
import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import { fetchUserAccessState, loginDemoUser, spendUserStars } from '@/lib/client-user-access'
import { clubOutlets } from '@/lib/club-booking-data'
import { buildArtistDirectoryHref } from '@/lib/artist-segments'
import { artistProfiles } from '@/lib/artist-directory-data'
import type { AudioTrack } from '@/lib/audio-types'
import { curateMusicCatalog } from '@/lib/music-curation'
import { tidalNonstopTracks, tidalRemixTracks } from '@/lib/music-frontend-data'
import { catalogItemToAudioTrack, fetchPublicMusicCatalog } from '@/lib/public-music-catalog'
import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'
import { StarTopupDialog } from '@/components/star-topup-dialog'

type NewsCategory = 'all' | 'events' | 'music' | 'nightlife' | 'interview' | 'review' | 'tech'
type ArtistFilter = 'all' | 'dj' | 'mc' | 'rapper' | 'dancer' | 'photographer' | 'model' | 'designer' | 'female' | 'male'
type RankingVoteTarget =
  | { kind: 'artist'; id: number }
  | { kind: 'ranking'; id: string }
  | { kind: 'ranking'; rank: number }

type HomeRankingItem = {
  id: string
  rank: number
  name: string
  role: string
  meta: string
  votes: number
  image: string
}

const mojibakePattern = /[ÃÂÄÅÆÐØÞáºá»â€]/u

function repairVietnameseText(input: string) {
  if (!mojibakePattern.test(input)) return input

  let current = input

  try {
    for (let index = 0; index < 3; index += 1) {
      const bytes = Uint8Array.from(current, (char) => char.charCodeAt(0) & 0xff)
      const next = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      if (next === current) break
      current = next
      if (!mojibakePattern.test(current)) break
    }
  } catch {
    return input
  }

  return current
}

const newsTabs: { label: string; value: NewsCategory }[] = [
  { label: 'Tất Cả', value: 'all' },
  { label: 'Sự Kiện', value: 'events' },
  { label: 'Âm Nhạc', value: 'music' },
  { label: 'Nightlife', value: 'nightlife' },
  { label: 'Interview', value: 'interview' },
  { label: 'Review', value: 'review' },
  { label: 'Công Nghệ', value: 'tech' }
]

const newsItems = [
  {
    category: 'events',
    slug: 'dem-nhac-edm-quoc-te-tai-tp-hcm',
    label: 'Sự Kiện',
    date: '10 Tháng 7, 2026',
    title: 'Đêm nhạc EDM quốc tế thu hút 10,000 khán giả tại TP.HCM',
    description: 'Sự kiện âm nhạc điện tử lớn nhất mùa hè với sự góp mặt của các DJ hàng đầu thế giới.',
    image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=900&h=600&fit=crop'
  },
  {
    category: 'events',
    slug: 'countdown-2027-ha-noi-lineup-dau-tien',
    label: 'Sự Kiện',
    date: '08 Tháng 7, 2026',
    title: 'Countdown 2027 công bố lineup đầu tiên tại Hà Nội',
    description: 'Chuỗi sự kiện đón năm mới hứa hẹn bùng nổ với sân khấu 360 độ đầu tiên tại Việt Nam.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=600&fit=crop'
  },
  {
    category: 'music',
    slug: 'top-dj-viet-nam-dang-len-2026',
    label: 'Âm Nhạc',
    date: '09 Tháng 7, 2026',
    title: 'Top 10 DJ Việt Nam đang lên: Xu hướng âm nhạc 2026',
    description: 'Những cái tên trẻ đang làm mới bản đồ nightlife bằng sound hiện đại và cách xây cộng đồng riêng.',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=900&h=600&fit=crop'
  },
  {
    category: 'nightlife',
    slug: 'hybrid-club-media-package',
    label: 'Nightlife',
    date: '06 Tháng 7, 2026',
    title: 'Mô hình hybrid club đang thay đổi cách venue bán vé và media package',
    description: 'Venue kết hợp show trực tiếp, nội dung số và combo nhạc thương mại để tăng doanh thu.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=600&fit=crop'
  },
  {
    category: 'interview',
    slug: 'echo-violet-producer-va-community',
    label: 'Interview',
    date: '05 Tháng 7, 2026',
    title: 'Echo Violet: “Producer giờ phải hiểu cả thương hiệu lẫn community”',
    description: 'Chia sẻ về chiến lược xây catalog, live set và cách nghệ sĩ độc lập mở rộng nguồn thu.',
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=900&h=600&fit=crop'
  },
  {
    category: 'tech',
    slug: 'waveform-preview-signed-download-music-commerce',
    label: 'Công Nghệ',
    date: '04 Tháng 7, 2026',
    title: 'Waveform preview và signed download đang trở thành chuẩn mới cho music commerce',
    description: 'Các nền tảng bán nhạc số tối ưu trải nghiệm nghe thử, bản quyền và kiểm soát file master.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&h=600&fit=crop'
  }
] as const

const featuredSlides = [
  {
    tag: 'Featured Story',
    title: '9LIFE MAG mở rộng từ trang tin sang hệ sinh thái booking và music commerce',
    description: 'Trang chủ mới ưu tiên bài nổi bật dạng slide để cảm giác gần với một tạp chí điện tử hơn, đồng thời dẫn người dùng xuống các khu vực artist, ranking và playlist.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&h=900&fit=crop'
  },
  {
    tag: 'Nightlife',
    title: 'Club culture đang chuyển mạnh sang mô hình nội dung số và chart cộng đồng',
    description: 'Các venue muốn vừa có tin tức, vừa có hồ sơ nghệ sĩ, vừa có playlist và ranking để giữ chân người dùng lâu hơn trên cùng một nền tảng.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&h=900&fit=crop'
  },
  {
    tag: 'Music',
    title: 'Playlist nonstop, top remix và gói nhạc thương mại trở thành điểm giữ traffic mới',
    description: 'Khối music phía dưới được mở rộng để người dùng không chỉ nghe thử mà còn có thêm nhiều điểm khám phá playlist và remix nổi bật.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&h=900&fit=crop'
  },
  {
    tag: 'Artists',
    title: 'Profile nghệ sĩ, bảng xếp hạng và booking đang được gom vào cùng một hành trình khám phá',
    description: 'Người dùng có thể đi từ bài viết nổi bật sang profile nghệ sĩ, bảng xếp hạng tuần và các điểm chạm booking mà không bị đứt mạch trải nghiệm.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&h=900&fit=crop'
  },
  {
    tag: 'Night Club',
    title: 'Tab đặt bàn giúp khám phá outlet theo miền, xem profile venue và chọn trải nghiệm nightlife phù hợp',
    description: 'Các outlet được chia theo Miền Nam, Miền Trung và Miền Bắc để người dùng vào nhanh đúng khu vực và chọn đúng night club cho nhóm của mình.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1400&h=900&fit=crop'
  }
] as const

const artistTabs: { label: string; value: ArtistFilter }[] = [
  { label: 'Tất Cả', value: 'all' },
  { label: 'DJ', value: 'dj' },
  { label: 'MC Hype', value: 'mc' },
  { label: 'Rapper', value: 'rapper' },
  { label: 'Dancer', value: 'dancer' },
  { label: 'Photographer', value: 'photographer' },
  { label: 'Model', value: 'model' },
  { label: 'Designer', value: 'designer' },
  { label: 'Nữ', value: 'female' },
  { label: 'Nam', value: 'male' }
]

const artists = repairVietnameseValue(artistProfiles).map((artist) => ({
  ...artist,
  roleLabel: artist.role,
  genre: artist.genres,
}))

const initialArtistVotes: Record<number, number> = Object.fromEntries(
  artists.map((artist, index) => [artist.id, Math.max(4200, 12847 - index * 710)]),
)

const featuredArtistBatchSize = 4
const featuredArtistRotationPrefix = '9life-featured-artists-v2'

function shuffleArtistIds(ids: number[]) {
  const shuffled = [...ids]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

function getFairFeaturedArtistIds(filter: ArtistFilter, artistIds: number[]) {
  if (typeof window === 'undefined' || artistIds.length === 0) return artistIds.slice(0, featuredArtistBatchSize)

  const storageKey = `${featuredArtistRotationPrefix}:${filter}`
  const availableIds = new Set(artistIds)
  let remainingIds: number[] = []

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { remainingIds?: unknown }
    if (Array.isArray(saved.remainingIds)) {
      const seen = new Set<number>()
      remainingIds = saved.remainingIds.filter((id): id is number => {
        if (typeof id !== 'number' || !availableIds.has(id) || seen.has(id)) return false
        seen.add(id)
        return true
      })
    }
  } catch {
    remainingIds = []
  }

  const selectedIds: number[] = []
  while (selectedIds.length < Math.min(featuredArtistBatchSize, artistIds.length)) {
    if (remainingIds.length === 0) {
      const nextCycle = shuffleArtistIds(artistIds)
      const selectedSet = new Set(selectedIds)
      remainingIds = [...nextCycle.filter((id) => !selectedSet.has(id)), ...nextCycle.filter((id) => selectedSet.has(id))]
    }

    const nextId = remainingIds.shift()
    if (nextId !== undefined && !selectedIds.includes(nextId)) selectedIds.push(nextId)
  }

  window.localStorage.setItem(storageKey, JSON.stringify({ remainingIds }))
  return selectedIds
}

const rankingSeed = [
  { rank: 1, name: 'Neon Viper', role: 'DJ', genre: 'EDM / Future Rave', votes: 12847, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { rank: 2, name: 'Echo Violet', role: 'Producer', genre: 'Future Bass / Pop EDM', votes: 10532, image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop' },
  { rank: 3, name: 'Ghost Frequency', role: 'Producer', genre: 'Lo-Fi / Ambient', votes: 9104, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
  { rank: 4, name: 'Dark Rythm', role: 'DJ', genre: 'DnB / Jungle', votes: 8750, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { rank: 5, name: 'Echo Violet', role: 'Producer', genre: 'Future Bass', votes: 7230, image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop' },
  { rank: 6, name: 'Ghost Frequency', role: 'Producer', genre: 'Lo-Fi / Ambient', votes: 6540, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
  { rank: 7, name: 'Cyber Rose', role: 'DJ', genre: 'Hardstyle / Trance', votes: 5890, image: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop' },
  { rank: 8, name: 'K-Phantom', role: 'Producer', genre: 'Trap / Drill', votes: 4320, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { rank: 9, name: 'Luna Flux', role: 'DJ', genre: 'House / Afro Beat', votes: 3985, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { rank: 10, name: 'Nova Mist', role: 'Producer', genre: 'Synthwave / Chill', votes: 3650, image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop' }
]

const allArtistRankingSeed: HomeRankingItem[] = rankingSeed.map((item) => ({
  id: `artist-all-${item.rank}`,
  rank: item.rank,
  name: item.name,
  role: item.role,
  meta: item.genre,
  votes: item.votes,
  image: item.image
}))

const missDjRankingSeed: HomeRankingItem[] = [
  {
    id: 'miss-dj-1',
    rank: 1,
    name: 'Cyber Rose',
    role: 'Miss DJ',
    meta: 'Hardstyle / Trance',
    votes: 8620,
    image: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-2',
    rank: 2,
    name: 'Luna Flux',
    role: 'Miss DJ',
    meta: 'House / Afro Beat',
    votes: 7912,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-3',
    rank: 3,
    name: 'Velvet Pulse',
    role: 'Miss DJ',
    meta: 'Open Format / Club Pop',
    votes: 7058,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-4',
    rank: 4,
    name: 'Astra Lyn',
    role: 'Miss DJ',
    meta: 'Melodic House / Sunset Set',
    votes: 6485,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-5',
    rank: 5,
    name: 'Mira Wave',
    role: 'Miss DJ',
    meta: 'Tech House / Peak Hour',
    votes: 5924,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-6',
    rank: 6,
    name: 'Nina Volt',
    role: 'Miss DJ',
    meta: 'Electro House / Peak Set',
    votes: 5488,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-7',
    rank: 7,
    name: 'Jade Rhythm',
    role: 'Miss DJ',
    meta: 'Techno / Warehouse',
    votes: 5164,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-8',
    rank: 8,
    name: 'Sera Bloom',
    role: 'Miss DJ',
    meta: 'Deep House / Lounge',
    votes: 4826,
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-9',
    rank: 9,
    name: 'Kira Flame',
    role: 'Miss DJ',
    meta: 'Bass House / Club Energy',
    votes: 4510,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
  },
  {
    id: 'miss-dj-10',
    rank: 10,
    name: 'Maya Pulse',
    role: 'Miss DJ',
    meta: 'Open Format / Event Set',
    votes: 4235,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
  }
]

const topClubRankingSeed: HomeRankingItem[] = [
  clubOutlets[0],
  clubOutlets[8],
  clubOutlets[16],
  clubOutlets[6],
  clubOutlets[14],
  clubOutlets[20],
  clubOutlets[1],
  clubOutlets[12],
  clubOutlets[18],
  clubOutlets[22]
].map((outlet, index) => ({
  id: `top-club-${outlet.slug}`,
  rank: index + 1,
  name: outlet.name,
  role: 'Top Club',
  meta: `${repairVietnameseText(outlet.city)} • ${repairVietnameseText(outlet.type)}`,
  votes: [15420, 14280, 13340, 12110, 11475, 10980, 10325, 9780, 9345, 9015][index],
  image: outlet.image
}))

const newArtists = [
  {
    name: 'Aster Blink',
    role: 'DJ / New Face',
    genre: 'Melodic House',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=320&h=320&fit=crop'
  },
  {
    name: 'Miko Lane',
    role: 'Producer / New Face',
    genre: 'Future Pop',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=320&h=320&fit=crop'
  },
  {
    name: 'Rex Nova',
    role: 'DJ / New Face',
    genre: 'Tech House',
    image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=320&h=320&fit=crop'
  },
  {
    name: 'Sora Vee',
    role: 'Producer / New Face',
    genre: 'Chill Electronica',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&h=320&fit=crop'
  }
] as const

const tracks = [
  {
    id: 'nonstop-1',
    title: 'Summer EDM Nonstop 2026',
    artist: 'Mixed by DJ Neon Viper',
    duration: '58:32',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    likes: '18.4K'
  },
  {
    id: 'nonstop-2',
    title: 'Trap Dynasty Mix Vol.3',
    artist: 'Mixed by K-Phantom',
    duration: '42:18',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    likes: '15.1K'
  },
  {
    id: 'nonstop-3',
    title: 'Retro Wave Night Drive',
    artist: 'Mixed by Ghost Frequency',
    duration: '1:12:45',
    cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    likes: '12.6K'
  },
  {
    id: 'nonstop-4',
    title: 'Techno Underground Session',
    artist: 'Mixed by Sky Raver',
    duration: '1:05:00',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    likes: '10.8K'
  },
  {
    id: 'nonstop-5',
    title: 'Future Bass Chillout',
    artist: 'Mixed by Echo Violet',
    duration: '48:22',
    cover: 'https://images.unsplash.com/photo-1459749411177-0473ef7161a9?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    likes: '9.9K'
  },
  {
    id: 'nonstop-6',
    title: 'Velvet Rooftop Session',
    artist: 'Mixed by Luna Flux',
    duration: '51:10',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    likes: '8.7K'
  },
  {
    id: 'nonstop-7',
    title: 'After Hours Gold Run',
    artist: 'Mixed by Ghost Frequency',
    duration: '59:44',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    likes: '8.1K'
  }
] as const

const pricing = [
  {
    name: 'Single Track',
    price: '99.000',
    unit: 'VND',
    features: ['WAV + MP3', 'Personal license', 'Instant download']
  },
  {
    name: 'Pro Pack',
    price: '320.000',
    unit: 'VND',
    features: ['5 track bundle', 'Performance license', 'Preview + metadata']
  },
  {
    name: 'Monthly Vault',
    price: '790.000',
    unit: 'VND',
    features: ['12 track package', 'WAV + MP3 + cue sheets', 'Cập nhật hàng tháng']
  }
] as const

const remixTracks = [
  {
    id: 'remix-1',
    title: 'Midnight Pulse Remix',
    artist: 'Neon Viper x Luna Flux',
    duration: '06:14',
    likes: '12.8K',
    downloads: 4281,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 'remix-2',
    title: 'Future Heat Rework',
    artist: 'Echo Violet',
    duration: '05:38',
    likes: '11.2K',
    downloads: 3954,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 'remix-3',
    title: 'Ghost City Extended Remix',
    artist: 'Ghost Frequency',
    duration: '07:22',
    likes: '9.7K',
    downloads: 3518,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 'remix-4',
    title: 'Skyline Afterparty Edit',
    artist: 'Sky Raver',
    duration: '05:52',
    likes: '8.9K',
    downloads: 2964,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 'remix-5',
    title: 'Dark Room Club Mix',
    artist: 'K-Phantom',
    duration: '06:47',
    likes: '8.1K',
    downloads: 2721,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 'remix-6',
    title: 'Velvet Signal Refix',
    artist: 'Luna Flux x Echo Violet',
    duration: '05:54',
    likes: '7.8K',
    downloads: 2416,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: 'remix-7',
    title: 'Warehouse Voltage Edit',
    artist: 'Sky Raver',
    duration: '06:09',
    likes: '7.1K',
    downloads: 2188,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    downloadUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  }
] as const

const homeNonstopCatalog = [...tidalNonstopTracks, ...tidalRemixTracks.slice(0, 4)]
const homeRemixCatalog = [...tidalRemixTracks, ...tidalNonstopTracks.slice(0, 4)]

export default function HomePage() {
  const [activeNewsTab, setActiveNewsTab] = useState<NewsCategory>('all')
  const [activeArtistTab, setActiveArtistTab] = useState<ArtistFilter>('all')
  const [featuredArtistIds, setFeaturedArtistIds] = useState<number[]>([])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [artistVotes, setArtistVotes] = useState<Record<number, number>>(initialArtistVotes)
  const [rankingVotes, setRankingVotes] = useState<Record<string, number>>(
    Object.fromEntries(
      [...allArtistRankingSeed, ...missDjRankingSeed, ...topClubRankingSeed].map((item) => [item.id, item.votes])
    )
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(10)
  const [showVoteLogin, setShowVoteLogin] = useState(false)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [pendingVote, setPendingVote] = useState<RankingVoteTarget | null>(null)
  const [votedTargets, setVotedTargets] = useState<string[]>([])
  const [homeNonstopTracks, setHomeNonstopTracks] = useState<AudioTrack[]>(homeNonstopCatalog.slice(0, 10))
  const [homeRemixTracks, setHomeRemixTracks] = useState<AudioTrack[]>(homeRemixCatalog.slice(0, 10))

  const filteredNews = useMemo(() => {
    if (activeNewsTab === 'all') return newsItems
    return newsItems.filter((item) => item.category === activeNewsTab)
  }, [activeNewsTab])

  const filteredArtists = useMemo(() => {
    if (activeArtistTab === 'all') return artists
    if (activeArtistTab === 'dj' || activeArtistTab === 'mc' || activeArtistTab === 'rapper' || activeArtistTab === 'dancer' || activeArtistTab === 'photographer' || activeArtistTab === 'model' || activeArtistTab === 'designer') {
      return artists.filter((item) => item.category === activeArtistTab)
    }
    return artists.filter((item) => item.gender === activeArtistTab)
  }, [activeArtistTab])

  const activeSlide = featuredSlides[activeSlideIndex]
  const visibleArtists = useMemo(() => {
    const artistById = new Map<number, (typeof artists)[number]>()
    filteredArtists.forEach((artist) => artistById.set(artist.id, artist))
    const rotatedArtists = featuredArtistIds
      .map((artistId) => artistById.get(artistId))
      .filter((artist): artist is (typeof artists)[number] => artist !== undefined)

    return rotatedArtists.length > 0 ? rotatedArtists : filteredArtists.slice(0, featuredArtistBatchSize)
  }, [featuredArtistIds, filteredArtists])

  useEffect(() => {
    setFeaturedArtistIds(getFairFeaturedArtistIds(activeArtistTab, filteredArtists.map((artist) => artist.id)))
  }, [activeArtistTab, filteredArtists])

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setStarBalance(snapshot.state.stars)
    })()
  }, [])

  useEffect(() => {
    void fetchPublicMusicCatalog().then((tracks) => {
      const mappedNonstop = tracks
        .filter((track) => track.displayMap.includes('Trang chủ - Nonstop picks'))
        .map(catalogItemToAudioTrack)
      const mappedRemix = tracks
        .filter((track) => track.displayMap.includes('Trang chủ - Top Remix'))
        .map(catalogItemToAudioTrack)
      setHomeNonstopTracks(curateMusicCatalog([...mappedNonstop, ...homeNonstopCatalog], 'nine-life-home-nonstop-rotation-v1'))
      setHomeRemixTracks(curateMusicCatalog([...mappedRemix, ...homeRemixCatalog], 'nine-life-home-remix-rotation-v1'))
    }).catch(() => {
      setHomeNonstopTracks(curateMusicCatalog(homeNonstopCatalog, 'nine-life-home-nonstop-rotation-v1'))
      setHomeRemixTracks(curateMusicCatalog(homeRemixCatalog, 'nine-life-home-remix-rotation-v1'))
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % featuredSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [])

  const getVoteKey = (vote: RankingVoteTarget) => {
    if (vote.kind === 'artist') return `artist:${vote.id}`
    if ('id' in vote) return `ranking:${vote.id}`
    return `ranking-rank:${vote.rank}`
  }

  const performVote = async (vote: RankingVoteTarget) => {
    const result = await spendUserStars(1, 'vote')

    if (!result.ok) {
      if (result.reason === 'not_authenticated') {
        setPendingVote(vote)
        setShowVoteLogin(true)
        return
      }

      if (result.reason === 'insufficient_stars') {
        setShowTopupModal(true)
        return
      }

      window.alert('Bạn không đủ sao để vote. Hãy nạp thêm sao trong tài khoản.')
      return
    }

    setStarBalance(result.state.stars)
    setVotedTargets((current) => {
      const voteKey = getVoteKey(vote)
      return current.includes(voteKey) ? current : [...current, voteKey]
    })

    if (vote.kind === 'artist') {
      setArtistVotes((prev) => ({ ...prev, [vote.id]: prev[vote.id] + 1 }))
      return
    }

    const rankingId = 'id' in vote ? vote.id : `artist-all-${vote.rank}`
    setRankingVotes((prev) => ({ ...prev, [rankingId]: prev[rankingId] + 1 }))
  }

  const handleVoteLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!loginEmail || !loginPassword) return

    const result = await loginDemoUser(loginEmail, loginPassword)
    if (!result.ok) {
      window.alert(result.message ?? 'Đăng nhập chưa thành công.')
      return
    }

    const snapshot = await fetchUserAccessState()
    setIsAuthenticated(snapshot.state.isAuthenticated)
    setStarBalance(snapshot.state.stars)
    setShowVoteLogin(false)
    setLoginPassword('')

    if (pendingVote) {
      const queuedVote = pendingVote
      setPendingVote(null)
      window.setTimeout(() => void performVote(queuedVote), 0)
    }
  }

  const renderRankingBoard = (
    board: {
      key: string
      title: string
      subtitle: string
      ctaLabel: string
      ctaHref: string
      items: HomeRankingItem[]
    }
  ) => {
    const featuredItems = board.items.slice(0, 3)
    const listItems = board.items.slice(3)

    return (
      <article key={board.key} className={`ranking-board ranking-board-${board.key}`}>
        <div className="ranking-board-head">
          <div>
            <p className="section-eyebrow">{board.title}</p>
            <h3>{board.subtitle}</h3>
          </div>
          <Link href={board.ctaHref} className="more-link-unified">
            {board.ctaLabel}
          </Link>
        </div>

        <div className="ranking-board-grid">
          <div className="top-ranking top-ranking-tiered">
            {featuredItems.map((item, index) => (
              <article
                key={item.id}
                className={
                  index === 0
                    ? 'ranking-podium ranking-podium-first'
                    : index === 1
                      ? 'ranking-podium ranking-podium-second'
                      : 'ranking-podium ranking-podium-third'
                }
              >
                {index === 0 ? <img src={item.image} alt="" aria-hidden="true" className="ranking-podium-fill" /> : null}
                <div className="ranking-podium-content">
                  <span className={`ranking-medal ranking-medal-${index + 1}`}>
                    <span className="ranking-medal-icon">
                      {index === 0 ? <Gem size={14} /> : null}
                      {index === 1 ? <Trophy size={14} /> : null}
                      {index === 2 ? <Medal size={14} /> : null}
                    </span>
                    #{item.rank}
                  </span>
                  <img src={item.image} alt={item.name} className="ranking-avatar" />
                  <h3>{item.name}</h3>
                  <p className="muted">{item.role}</p>
                  <div className="ranking-total-votes">
                    <strong>{(rankingVotes[item.id] ?? item.votes).toLocaleString('en-US')}</strong>
                    <span className="muted">votes</span>
                  </div>
                  <div className="ranking-podium-actions">
                    <button
                      type="button"
                      className={votedTargets.includes(getVoteKey({ kind: 'ranking', id: item.id })) ? 'mini-button mini-button-liked' : 'mini-button'}
                      onClick={() => performVote({ kind: 'ranking', id: item.id })}
                    >
                      Vote
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="ranking-list ranking-list-compact">
            {listItems.map((item) => (
              <div key={item.id} className="ranking-row">
                <span className="ranking-index">{item.rank}</span>
                <img src={item.image} alt={item.name} className="ranking-list-avatar" />
                <div className="ranking-meta">
                  <strong>{item.name}</strong>
                  <span className="muted">{item.role} • {item.meta}</span>
                </div>
                <div className="ranking-votes">
                  <strong>{(rankingVotes[item.id] ?? item.votes).toLocaleString('en-US')}</strong>
                  <span className="muted">votes</span>
                </div>
                <button
                  type="button"
                  className={votedTargets.includes(getVoteKey({ kind: 'ranking', id: item.id })) ? 'mini-button mini-button-liked' : 'mini-button'}
                  onClick={() => performVote({ kind: 'ranking', id: item.id })}
                >
                  Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="home-9life">
      <section className="hero-9life" aria-label="Hero">
        <div className="home-noise" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="container hero-9life-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Cộng đồng giải trí & âm nhạc chuyên nghiệp
          </div>
          <h1 className="hero-9life-title">
            <span>NGHỆ THUẬT</span>
            <strong>KHÔNG GIỚI HẠN</strong>
          </h1>
          <p className="hero-9life-copy">
            Tin tức giải trí đa chiều. Bảng xếp hạng nghệ sĩ DJ & Producer. Nghe và tải nhạc
            nonstop chất lượng cao.
          </p>
          <div className="hero-9life-actions">
            <a href="#ranking" className="button">Bảng Xếp Hạng</a>
            <a href="#music" className="button-secondary">Nghe Nhạc Nonstop</a>
          </div>

          <div className="headline-slider">
            <article className="headline-slide">
              <img src={activeSlide.image} alt={activeSlide.title} className="headline-slide-image" />
              <div className="headline-slide-overlay" />
              <div className="headline-slide-copy">
                <span className="media-label">{activeSlide.tag}</span>
                <h3>{activeSlide.title}</h3>
                <p>{activeSlide.description}</p>
              </div>
            </article>

            <div className="headline-dots">
              {featuredSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={index === activeSlideIndex ? 'headline-dot headline-dot-active' : 'headline-dot'}
                  onClick={() => setActiveSlideIndex(index)}
                  aria-label={`Hiển thị slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="news" className="home-section">
        <div className="container">
          <div className="home-section-head">
            <div>
              <h2 className="home-title">Tin Tức <span>&</span> Sự Kiện</h2>
              <p className="muted">Cập nhật đa chủ đề từ ngành công nghiệp giải trí và nightlife.</p>
            </div>
            <Link href="/tin-tuc" className="section-link">Xem tất cả</Link>
          </div>

          <div className="tab-strip">
            {newsTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={activeNewsTab === tab.value ? 'chip chip-active' : 'chip'}
                onClick={() => setActiveNewsTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="home-grid home-grid-3">
            {filteredNews.map((article) => (
              <article key={article.title} className="glass-card-9life">
                <Link
                  href={`/tin-tuc/${article.slug}`}
                  className="media-wrap media-wrap-link"
                  aria-label={`Mở bài viết: ${repairVietnameseText(article.title)}`}
                >
                  <img src={article.image} alt={article.title} className="media-cover" />
                  <span className="media-label">{article.label}</span>
                </Link>
                <div className="card-copy">
                  <time className="small-meta">{article.date}</time>
                  <h3>{article.title}</h3>
                  <p className="muted">{article.description}</p>
                  <div className="card-action-row">
                    <Link href={`/tin-tuc/${article.slug}`} className="more-link-unified">
                      Xem thêm
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="artists" className="home-section home-section-alt">
        <div className="container">
          <div className="home-section-head">
            <div>
              <h2 className="home-title">Nghệ Sĩ <span>Tiêu Biểu</span></h2>
              <p className="muted">Hồ sơ booking, khả năng biểu diễn và cộng đồng fan được gom trên cùng một trang.</p>
            </div>
            <Link href="/nghe-si" className="section-link home-artist-directory-link">Xem hồ sơ nghệ sĩ</Link>
          </div>

          <div className="tab-strip">
            {artistTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={activeArtistTab === tab.value ? 'chip chip-active' : 'chip'}
                onClick={() => setActiveArtistTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="home-grid home-grid-4">
            {visibleArtists.map((artist) => (
              <article key={artist.id} className="artist-profile-card home-featured-artist-card">
                <div className="artist-profile-media">
                  <Link
                    href={`/nghe-si/${artist.slug}`}
                    className="artist-profile-image-link"
                    aria-label={`Xem hồ sơ ${artist.name}`}
                  >
                    <img src={artist.image} alt={artist.name} />
                  </Link>
                  <div className="artist-profile-gradient" />
                  <div className="artist-profile-tags">
                    <span className="pill">{artist.roleLabel}</span>
                    <span className="pill">{artist.location}</span>
                  </div>
                </div>

                <div className="artist-profile-body">
                  <div className="artist-profile-head">
                    <div>
                      <h3>
                        <Link href={`/nghe-si/${artist.slug}`}>{artist.name}</Link>
                      </h3>
                      <span className="artist-profile-role">{artist.roleLabel}</span>
                      <p>{artist.genre}</p>
                    </div>
                    <span className="artist-profile-followers">
                      {artistVotes[artist.id].toLocaleString('en-US')} vote
                    </span>
                  </div>

                  <div className="artist-profile-actions">
                    <Link href={`/nghe-si/${artist.slug}`} className="mini-button">
                      <Eye size={15} />
                      <span>Profile</span>
                    </Link>
                    <Link href={`/booking?artist=${artist.slug}`} className="mini-button mini-button-alt">
                      <CalendarCheck2 size={15} />
                      <span>Booking</span>
                    </Link>
                    <button
                      type="button"
                      className={
                        votedTargets.includes(getVoteKey({ kind: 'artist', id: artist.id }))
                          ? 'mini-button artist-directory-vote-button artist-directory-vote-button-active'
                          : 'mini-button artist-directory-vote-button'
                      }
                      onClick={() => performVote({ kind: 'artist', id: artist.id })}
                    >
                      <Star
                        size={15}
                        fill={votedTargets.includes(getVoteKey({ kind: 'artist', id: artist.id })) ? 'currentColor' : 'none'}
                      />
                      <span>Vote</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="section-more">
            <Link href={buildArtistDirectoryHref({})} className="more-link-unified">
              Xem thêm nghệ sĩ
            </Link>
          </div>
        </div>
      </section>

      <section id="ranking" className="home-section">
        <div className="container">
          <div className="home-section-head">
            <div>
              <h2 className="home-title">Bảng Xếp Hạng <span>Tuần</span></h2>
              <p className="muted">Ranking do cộng đồng bình chọn, có thể nối tiếp với collection vote ở các vòng sau.</p>
            </div>
          </div>

          <div className="ranking-head-clean">
            <h2 className="home-title">Bảng Xếp Hạng <span>Tuần</span></h2>
            <p className="muted">Ba bảng xếp hạng song song cho nữ DJ, nghệ sĩ toàn nền tảng và outlet/night club nổi bật. Mỗi lượt vote đều trừ 1 sao.</p>
          </div>

          <div className="ranking-board-stack">
            {renderRankingBoard({
              key: 'miss-dj',
              title: 'Miss DJ',
              subtitle: 'BXH nữ DJ có lượt vote cao nhất tuần này',
              ctaLabel: 'Xem thêm nữ DJ',
              ctaHref: buildArtistDirectoryHref({ category: 'dj', gender: 'female' }),
              items: missDjRankingSeed
            })}

            {renderRankingBoard({
              key: 'all-artists',
              title: 'All Artist',
              subtitle: 'BXH chung cho toàn bộ nghệ sĩ có lượt vote cao nhất',
              ctaLabel: 'Xem thêm nghệ sĩ',
              ctaHref: buildArtistDirectoryHref({}),
              items: allArtistRankingSeed
            })}

            {renderRankingBoard({
              key: 'top-club',
              title: 'Top Club',
              subtitle: 'Outlet và night club đang được cộng đồng vote nhiều nhất',
              ctaLabel: 'Xem thêm outlet',
              ctaHref: '/dat-ban',
              items: topClubRankingSeed
            })}

            <div className="ranking-layout ranking-layout-stacked">
              <div className="top-ranking top-ranking-tiered">
                {artists.slice(0, 3).map((artist, index) => (
                  <article
                    key={artist.id}
                    className={
                      index === 0
                        ? 'ranking-podium ranking-podium-first'
                        : index === 1
                          ? 'ranking-podium ranking-podium-second'
                          : 'ranking-podium ranking-podium-third'
                    }
                  >
                    {index === 0 ? (
                      <img src={artist.image} alt="" aria-hidden="true" className="ranking-podium-fill" />
                    ) : null}
                    <div className="ranking-podium-content">
                      <span className={`ranking-medal ranking-medal-${index + 1}`}>
                        <span className="ranking-medal-icon">
                          {index === 0 ? <Gem size={16} /> : null}
                          {index === 1 ? <Trophy size={16} /> : null}
                          {index === 2 ? <Medal size={16} /> : null}
                        </span>
                        #{index + 1}
                      </span>
                      <img src={artist.image} alt={artist.name} className="ranking-avatar" />
                      <h3>{artist.name}</h3>
                      <p className="muted">{artist.roleLabel}</p>
                      <div className="ranking-total-votes">
                        <strong>{artistVotes[artist.id].toLocaleString('en-US')}</strong>
                        <span className="muted">votes</span>
                      </div>
                      <div className="ranking-podium-actions">
                        <button
                          type="button"
                          className={votedTargets.includes(getVoteKey({ kind: 'artist', id: artist.id })) ? 'mini-button mini-button-liked' : 'mini-button'}
                          onClick={() => performVote({ kind: 'artist', id: artist.id })}
                        >
                          Vote
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="ranking-list ranking-list-compact">
                {rankingSeed.slice(3).map((item) => (
                  <div key={item.rank} className="ranking-row">
                    <span className="ranking-index">{item.rank}</span>
                    <img src={item.image} alt={item.name} className="ranking-list-avatar" />
                    <div className="ranking-meta">
                      <strong>{item.name}</strong>
                      <span className="muted">{item.role} • {item.genre}</span>
                    </div>
                    <div className="ranking-votes">
                      <strong>{(rankingVotes[`artist-all-${item.rank}`] ?? item.votes).toLocaleString('en-US')}</strong>
                      <span className="muted">votes</span>
                    </div>
                    <button
                      type="button"
                      className={votedTargets.includes(getVoteKey({ kind: 'ranking', rank: item.rank })) ? 'mini-button mini-button-liked' : 'mini-button'}
                      onClick={() => performVote({ kind: 'ranking', rank: item.rank })}
                    >
                      Vote
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="new-artists-panel">
              <div className="new-artists-head">
                <h3>Nghệ sỹ mới</h3>
                <p className="muted">Những gương mặt mới đang được cộng đồng theo dõi nhiều.</p>
              </div>

              <div className="new-artists-grid">
                {newArtists.map((artist) => (
                  <article key={artist.name} className="new-artist-card">
                    <img src={artist.image} alt={artist.name} className="new-artist-avatar" />
                    <h4>{artist.name}</h4>
                    <p className="muted">{artist.role}</p>
                    <span className="new-artist-genre">{artist.genre}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="section-more">
            <Link href="/music#charts" className="more-link-unified">
              Xem thêm bảng xếp hạng
            </Link>
          </div>
        </div>
      </section>

      <section id="music" className="home-section home-section-alt">
        <div className="container">
          <div className="home-section-head">
            <div>
              <h2 className="home-title">Nonstop Music <span>& Store</span></h2>
              <p className="muted">Kết hợp playlist nghe thử, CTA mua nhạc và package thương mại trên cùng một mặt bằng nội dung.</p>
            </div>
            <Link href="/music" className="section-link">Đi đến Music</Link>
          </div>

          <div className="music-dual-layout">
            <div className="music-dual-panel">
              <div className="home-section-head music-panel-head">
                <div>
                  <h2 className="home-title">Nonstop <span>Picks</span></h2>
                  <p className="muted">List dày hơn để user lướt nhanh nhiều nonstop ngay tại trang chủ.</p>
                </div>
                <Link href="/music#listen-now" className="more-link-unified">Xem thêm</Link>
              </div>

              <AudioShowcasePlayer
                title="Nonstop Playlist"
                subtitle="Playlist nonstop nổi bật"
                tracks={homeNonstopTracks}
                density="compact"
              />
            </div>

            <div className="music-dual-panel">
              <div className="home-section-head music-panel-head">
                <div>
                  <h2 className="home-title">Top Remix <span>Yêu Thích</span></h2>
                  <p className="muted">Remix nhiều hơn để lấp mặt bằng và tăng điểm chạm nghe thử.</p>
                </div>
                <Link href="/music#top-remix" className="more-link-unified">Xem thêm remix</Link>
              </div>

              <AudioShowcasePlayer
                title="Top Remix"
                subtitle="Remix nổi bật trong tuần"
                tracks={homeRemixTracks}
                variant="remix"
                density="compact"
              />
            </div>
          </div>

          <div className="section-more">
            <Link href="/music#listen-now" className="more-link-unified">
              Xem thêm playlist
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="home-section">
        <div className="container contact-shell">
          <h2 className="contact-title">
            Sẵn sàng cho <span>sự kiện tiếp theo?</span>
          </h2>
          <p className="contact-copy">
            Dù bạn là promoter, club owner hay nghệ sĩ tìm kiếm cơ hội, 9LIFE MAG là cầu nối giữa nội dung,
            booking và music commerce.
          </p>
          <div className="contact-actions">
            <Link href="/booking" className="button">Gửi booking</Link>
            <a href="mailto:booking@9lifemag.com" className="button-secondary">booking@9lifemag.com</a>
          </div>
        </div>
      </section>

      {showVoteLogin ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Đăng nhập để vote</div>
            <h3>Vote sẽ trừ 1 sao từ ví user</h3>
            <p className="muted">
              {isAuthenticated
                ? `Bạn hiện còn ${starBalance} sao để dùng cho vote, play và premium unlock.`
                : 'Hãy đăng nhập trước để hệ thống trừ sao hợp lý khi bạn vote cho nghệ sĩ hoặc bảng xếp hạng.'}
            </p>

            <form className="login-gate-form" onSubmit={handleVoteLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
              <div className="login-gate-actions">
                <button type="button" className="button-secondary" onClick={() => setShowVoteLogin(false)}>
                  Để sau
                </button>
                <button type="submit" className="button">
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <StarTopupDialog open={showTopupModal} onClose={() => setShowTopupModal(false)} />
    </main>
  )
}
