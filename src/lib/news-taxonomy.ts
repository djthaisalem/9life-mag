import { Flame, Headphones, Mic2, Radio } from 'lucide-react'

export const newsCategoryChips = ['Tất cả', 'Sự kiện', 'Nightlife', 'Nghệ sĩ', 'Review', 'Hậu trường', 'Xu hướng'] as const

export const newsSignalCards = [
  { icon: Flame, key: 'hot-topic', label: 'Hot Topic', value: 'Sự kiện nổi bật, aftermovie và các bài recap đáng chú ý', placement: 'Hot Topic / Tin tức', categories: ['Sự kiện', 'Hậu trường', 'Xu hướng'] },
  { icon: Headphones, key: 'music-pulse', label: 'Music Pulse', value: 'Nhạc mới, remix nổi bật và những set đang được quan tâm', placement: 'Music Pulse / Tin tức', categories: ['Âm nhạc', 'Review', 'Xu hướng'] },
  { icon: Mic2, key: 'artist-move', label: 'Artist Move', value: 'Hồ sơ mới, collab, cột mốc và chuyển động của nghệ sĩ', placement: 'Artist Move / Tin tức', categories: ['Nghệ sĩ', 'Hậu trường', 'Sự kiện'] },
  { icon: Radio, key: 'venue-mode', label: 'Venue Mode', value: 'Night club, concept đêm và câu chuyện từ các outlet', placement: 'Venue Mode / Tin tức', categories: ['Nightlife', 'Sự kiện', 'Hậu trường'] },
] as const

export const cmsArticlePlacementOptions = [
  { value: 'Feed tin tức', label: 'Trang tin tức', description: 'Hiển thị trong danh sách bài viết và các chuyên mục tin tức.' },
  { value: 'Headline slider trang chủ', label: 'Slide trang chủ', description: 'Đưa bài viết vào slider nổi bật ở đầu trang chủ.' },
  { value: 'Artist Portal Login Slider', label: 'Portal nghệ sĩ', description: 'Hiển thị trên slider tại trang đăng nhập và đăng ký nghệ sĩ.' },
  { value: 'Artist Directory Header Slider', label: 'Danh mục nghệ sĩ', description: 'Hiển thị trên slider giới thiệu tại trang danh sách nghệ sĩ.' },
  { value: 'Bài liên quan profile nghệ sĩ', label: 'Profile nghệ sĩ', description: 'Dùng làm nội dung liên quan trong profile nghệ sĩ.' },
  { value: 'Bài liên quan outlet profile', label: 'Profile outlet', description: 'Dùng làm nội dung liên quan trong profile outlet.' },
  { value: 'Hot Topic / Tin tức', label: 'Hot Topic', description: 'Gắn vào nhóm Hot Topic trên trang tin tức.' },
  { value: 'Music Pulse / Tin tức', label: 'Music Pulse', description: 'Gắn vào nhóm Music Pulse trên trang tin tức.' },
  { value: 'Artist Move / Tin tức', label: 'Artist Move', description: 'Gắn vào nhóm Artist Move trên trang tin tức.' },
  { value: 'Venue Mode / Tin tức', label: 'Venue Mode', description: 'Gắn vào nhóm Venue Mode trên trang tin tức.' },
] as const

export const cmsNewsPlacementOptions = cmsArticlePlacementOptions.map((option) => option.value)
