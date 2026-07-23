import type { Metadata } from 'next'

import { SharedPlaylistClient } from '@/components/shared-playlist-client'
import { createShareMetadata } from '@/lib/seo'
import { getSharedUserPlaylist } from '@/lib/shared-user-playlists'

type SharedPlaylistPageProps = {
  params: Promise<{ shareCode: string }>
}

function getShareImage(value?: string) {
  return value && (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value))
    ? value
    : '/images/default-music-cover.png'
}

export async function generateMetadata({ params }: SharedPlaylistPageProps): Promise<Metadata> {
  const { shareCode } = await params
  const playlist = await getSharedUserPlaylist(shareCode)
  if (!playlist) {
    return createShareMetadata({
      title: 'Playlist cộng đồng | 9LIFE Music',
      description: 'Khám phá playlist do cộng đồng 9LIFE Music tuyển chọn và chia sẻ.',
      path: `/music/library/${shareCode}`,
      image: '/images/default-music-cover.png',
    })
  }

  const description = playlist.note || `Nghe ${playlist.items.length} bản nhạc trong playlist ${playlist.name} trên 9LIFE Music.`
  const image = getShareImage(playlist.cover || playlist.items.find((item) => item.cover)?.cover)

  return createShareMetadata({
    title: `${playlist.name} | 9LIFE Music`,
    description,
    path: `/music/library/${shareCode}`,
    image,
  })
}

export default async function SharedPlaylistPage({ params }: SharedPlaylistPageProps) {
  const { shareCode } = await params
  const playlist = await getSharedUserPlaylist(shareCode)
  return <SharedPlaylistClient initialPlaylist={playlist} shareCode={shareCode} />
}
