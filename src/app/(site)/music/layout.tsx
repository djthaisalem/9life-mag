import type { Metadata } from 'next'

import { createShareMetadata } from '@/lib/seo'

export const metadata: Metadata = createShareMetadata({
  title: '9LIFE Music | Track, Nonstop, Remix & Playlist',
  description: 'Nghe track, nonstop, remix và playlist tuyển chọn từ nghệ sĩ cùng cộng đồng 9LIFE Music.',
  path: '/music',
  image: '/images/default-music-cover.png',
})

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return children
}
