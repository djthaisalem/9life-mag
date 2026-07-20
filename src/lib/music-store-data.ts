import type { AudioTrack } from '@/components/audio-showcase-player'

export const musicHighlights = [
  { label: 'Playlist đang giữ', value: '128+' },
  { label: 'Album đang giữ', value: '42' },
  { label: 'Remix chờ duyệt', value: '19' },
  { label: 'Artist cộng tác', value: '86' }
] as const

export const legacyPlaylists = [
  {
    title: 'Saigon After Dark',
    description: 'Playlist chủ lực cho nightlife set, giữ tinh thần club Việt từ source cũ.',
    type: 'Playlist',
    cover: '/music-legacy/bg/14.jpg',
    meta: '12 track · Featured'
  },
  {
    title: 'Deep Water Session',
    description: 'Không gian chill house và progressive cho lounge, rooftop, private event.',
    type: 'Editorial',
    cover: '/music-legacy/bg/21.jpg',
    meta: '08 track · Public'
  },
  {
    title: 'Rising Remix Picks',
    description: 'Danh sách remix đang được cộng đồng nghe nhiều và chờ duyệt đẩy lên home.',
    type: 'Remix',
    cover: '/music-legacy/bg/14.jpg',
    meta: '05 track · Login gate'
  }
] as const

export const legacyAlbums = [
  {
    title: 'Electric Bloom',
    artist: 'Neon Viper',
    status: 'Featured album',
    cover: '/music-legacy/bg/21.jpg'
  },
  {
    title: 'Velvet Frequency',
    artist: 'Luna Flux',
    status: 'Draft in CMS',
    cover: '/music-legacy/bg/14.jpg'
  },
  {
    title: 'Night Transit',
    artist: 'Ghost Frequency',
    status: 'Ready for publish',
    cover: '/music-legacy/bg/21.jpg'
  }
] as const

export const studioMenus = [
  'Loại nhạc',
  'Bài viết',
  'Album',
  'Playlist',
  'Duyệt nghệ sĩ',
  'Quản lý nghệ danh'
] as const

export const studioMembers = [
  {
    name: 'Cindy Deitch',
    role: 'Content operator',
    avatar: '/music-legacy/avatars/1.png'
  },
  {
    name: 'Josephin Doe',
    role: 'Artist support',
    avatar: '/music-legacy/avatars/6-small.png'
  },
  {
    name: 'Lary Doe',
    role: 'Playlist curator',
    avatar: '/music-legacy/avatars/4-small.png'
  },
  {
    name: 'Suzen',
    role: 'Remix reviewer',
    avatar: '/music-legacy/avatars/11-small.png'
  }
] as const

export const studioStats = [
  { title: 'Tổng playlist', value: '128', tone: 'primary' },
  { title: 'Album public', value: '42', tone: 'success' },
  { title: 'Track chờ duyệt', value: '19', tone: 'warning' },
  { title: 'Artist partner', value: '86', tone: 'info' }
] as const

export const musicCategories = ['EDM', 'House', 'Vinahouse', 'Progressive', 'Future Bass'] as const

export const profileOptions = ['Neon Viper', 'Luna Flux', 'Ghost Frequency', '9Life Community Lab'] as const

export const headerNotifications = ['4 New Notifications', '4 New Messages'] as const

export const nonstopTracks: readonly AudioTrack[] = [
  {
    id: 'legacy-playlist-1',
    title: 'Water Lily Intro Mix',
    artist: '9Life Legacy Session',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '8.4K',
    isPremiumDrop: true,
  },
  {
    id: 'legacy-playlist-2',
    title: 'Rooftop Pulse',
    artist: 'Mixed by Neon Viper',
    duration: '04:45',
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '6.1K'
  },
  {
    id: 'legacy-playlist-3',
    title: 'Downtown Bounce',
    artist: 'Curated by 9Life',
    duration: '04:45',
    cover: '/music-legacy/bg/14.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    likes: '5.8K'
  }
] as const

export const remixTracks: readonly AudioTrack[] = [
  {
    id: 'legacy-remix-1',
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
    id: 'legacy-remix-2',
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
    id: 'legacy-remix-3',
    title: 'Saigon Neon Edit',
    artist: '9Life Community Lab',
    duration: '04:45',
    likes: '7.9K',
    downloads: 2489,
    cover: '/music-legacy/bg/21.jpg',
    audioUrl: '/music-legacy/audio/water-lily.mp3',
    downloadUrl: '/music-legacy/audio/water-lily.mp3'
  }
] as const
