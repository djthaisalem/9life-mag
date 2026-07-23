import type { Metadata } from 'next'

import { SharedTrackClient } from '@/components/shared-track-client'
import { getMusicShareData } from '@/lib/music-share-data'
import { createShareMetadata } from '@/lib/seo'

type SharedTrackPageProps = {
  params: Promise<{ trackId: string }>
}

export async function generateMetadata({ params }: SharedTrackPageProps): Promise<Metadata> {
  const { trackId } = await params
  const data = await getMusicShareData(trackId)
  if (!data) {
    return createShareMetadata({
      title: 'Nghe nhạc trên 9LIFE Music',
      description: 'Khám phá track, nonstop và remix mới trên 9LIFE Music.',
      path: `/music/track/${trackId}`,
      image: '/images/default-music-cover.png',
    })
  }

  return createShareMetadata({
    title: `${data.track.title} - ${data.track.artist}`,
    description: data.description,
    path: `/music/track/${trackId}`,
    image: data.track.cover || '/images/default-music-cover.png',
  })
}

export default async function SharedTrackPage({ params }: SharedTrackPageProps) {
  const { trackId } = await params
  const data = await getMusicShareData(trackId)
  return <SharedTrackClient data={data} />
}
