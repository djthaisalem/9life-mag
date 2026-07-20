import { Flame, Headphones, Mic2, Radio } from 'lucide-react'

export const newsCategoryChips = ['Tất cả', 'Sự kiện', 'Nightlife', 'Nghệ sĩ', 'Review', 'Hậu trường', 'Xu hướng'] as const

export const newsSignalCards = [
  { icon: Flame, key: 'hot-topic', label: 'Hot Topic', value: 'Sự kiện nổi bật, aftermovie và các bài recap đáng chú ý', placement: 'Hot Topic / Tin tức', categories: ['Sự kiện', 'Hậu trường', 'Xu hướng'] },
  { icon: Headphones, key: 'music-pulse', label: 'Music Pulse', value: 'Nhạc mới, remix nổi bật và những set đang được quan tâm', placement: 'Music Pulse / Tin tức', categories: ['Âm nhạc', 'Review', 'Xu hướng'] },
  { icon: Mic2, key: 'artist-move', label: 'Artist Move', value: 'Hồ sơ mới, collab, cột mốc và chuyển động của nghệ sĩ', placement: 'Artist Move / Tin tức', categories: ['Nghệ sĩ', 'Hậu trường', 'Sự kiện'] },
  { icon: Radio, key: 'venue-mode', label: 'Venue Mode', value: 'Night club, concept đêm và câu chuyện từ các outlet', placement: 'Venue Mode / Tin tức', categories: ['Nightlife', 'Sự kiện', 'Hậu trường'] },
] as const

export const cmsNewsPlacementOptions = [
  'Feed tin tức', 'Headline slider trang chủ', 'Bài liên quan profile nghệ sĩ', 'Bài liên quan outlet profile',
  'Hot Topic / Tin tức', 'Music Pulse / Tin tức', 'Artist Move / Tin tức', 'Venue Mode / Tin tức',
  'Artist Portal Login Slider',
  'Artist Directory Header Slider',
] as const
