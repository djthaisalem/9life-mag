export type AudioTrack = {
  id: string
  title: string
  artist: string
  duration: string
  cover?: string
  audioUrl: string
  likes?: string
  downloads?: number
  downloadUrl?: string
  isPremiumDrop?: boolean
  protectedMedia?: boolean
}

export type AudioSourceType = 'nonstop' | 'track' | 'remix'
