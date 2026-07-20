export type MediaEmbedProvider = 'youtube' | 'facebook' | 'instagram' | 'soundcloud' | 'mixcloud'

export type MediaEmbed = {
  provider: MediaEmbedProvider
  src: string
  title: string
}

function parseUrl(value: string) {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

function getYouTubeId(url: URL) {
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? ''
  if (url.pathname.startsWith('/watch')) return url.searchParams.get('v') ?? ''
  const parts = url.pathname.split('/').filter(Boolean)
  if (['embed', 'shorts', 'live'].includes(parts[0] ?? '')) return parts[1] ?? ''
  return ''
}

export function getMediaEmbed(value: string): MediaEmbed | null {
  const url = parseUrl(value)
  if (!url) return null

  const host = url.hostname.replace(/^www\./, '').toLowerCase()

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'www.youtube-nocookie.com' || host === 'youtu.be') {
    const id = getYouTubeId(url)
    return id ? { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`, title: 'YouTube player' } : null
  }

  if (host === 'facebook.com' || host === 'm.facebook.com' || host === 'fb.watch') {
    if (url.pathname.startsWith('/plugins/video.php')) return { provider: 'facebook', src: url.toString(), title: 'Facebook video' }
    return {
      provider: 'facebook',
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&width=560`,
      title: 'Facebook video',
    }
  }

  if (host === 'instagram.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const type = parts[0]
    const id = parts[1]
    if (!id || !['p', 'reel', 'tv'].includes(type ?? '')) return null
    return { provider: 'instagram', src: `https://www.instagram.com/${type}/${id}/embed/captioned/`, title: 'Instagram post or reel' }
  }

  if (host === 'soundcloud.com' || host.endsWith('.soundcloud.com')) {
    return { provider: 'soundcloud', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&visual=true`, title: 'SoundCloud player' }
  }

  if (host === 'mixcloud.com') {
    return { provider: 'mixcloud', src: `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${encodeURIComponent(url.pathname)}`, title: 'Mixcloud player' }
  }

  return null
}
