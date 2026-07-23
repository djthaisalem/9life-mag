import { artistProfiles } from '@/lib/artist-directory-data'
import { clubOutlets } from '@/lib/club-booking-data'
import { tidalNonstopTracks, tidalRemixTracks } from '@/lib/music-frontend-data'
import { featuredArticles } from '@/lib/site-data'

export type SearchCategory = 'news' | 'artists' | 'outlets' | 'music'

export type SearchItem = {
  id: string
  category: SearchCategory
  title: string
  description: string
  image: string
  href: string
  label: string
}

export const searchIndex: SearchItem[] = [
  ...featuredArticles.map((article) => ({
    id: `news:${article.slug}`,
    category: 'news' as const,
    title: article.title,
    description: article.summary,
    image: article.image,
    href: `/tin-tuc/${article.slug}`,
    label: `Tin tức · ${article.category}`,
  })),
  ...artistProfiles.map((artist) => ({
    id: `artist:${artist.slug}`,
    category: 'artists' as const,
    title: artist.name,
    description: `${artist.role} · ${artist.genres} · ${artist.location}`,
    image: artist.image,
    href: `/nghe-si/${artist.slug}`,
    label: 'Nghệ sĩ',
  })),
  ...clubOutlets.map((outlet) => ({
    id: `outlet:${outlet.slug}`,
    category: 'outlets' as const,
    title: outlet.name,
    description: `${outlet.type} · ${outlet.city}. ${outlet.summary}`,
    image: outlet.image,
    href: `/dat-ban/${outlet.slug}`,
    label: `Outlet · ${outlet.regionLabel}`,
  })),
  ...[...tidalNonstopTracks, ...tidalRemixTracks].map((track) => ({
    id: `music:${track.id}`,
    category: 'music' as const,
    title: track.title,
    description: `${track.artist} · ${track.duration}`,
    image: track.cover ?? '/music-legacy/bg/14.jpg',
    href: `/music?track=${encodeURIComponent(track.id)}`,
    label: 'Music',
  })),
]

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function findSearchItems(query: string, category: SearchCategory | 'all', additionalItems: readonly SearchItem[] = []) {
  const keywords = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean)
  if (!keywords.length) return []

  return [...additionalItems, ...searchIndex].filter((item, index, items) => {
    if (items.findIndex((candidate) => candidate.id === item.id) !== index) return false
    if (category !== 'all' && item.category !== category) return false
    const content = normalizeSearchText(`${item.title} ${item.description} ${item.label}`)
    return keywords.every((keyword) => content.includes(keyword))
  })
}
