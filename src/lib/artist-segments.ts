import type { ArtistProfile } from '@/lib/artist-directory-data'

export type ArtistCategory = ArtistProfile['category']
export type ArtistGender = ArtistProfile['gender']

export type ArtistDirectoryFilters = {
  category: ArtistCategory | 'all'
  gender: ArtistGender | 'all'
}

export type ArtistSegmentRule = {
  category?: ArtistCategory[]
  gender?: ArtistGender[]
  city?: string[]
  slug?: string[]
}

export type ArtistSegmentDefinition = {
  key: string
  label: string
  rule: ArtistSegmentRule
}

export const defaultArtistDirectoryFilters: ArtistDirectoryFilters = {
  category: 'all',
  gender: 'all',
}

const validCategories: ArtistCategory[] = ['dj', 'mc', 'rapper', 'dancer', 'photographer', 'model', 'designer']
const validGenders: ArtistGender[] = ['female', 'male']

export function parseArtistDirectoryFilters(searchParams: URLSearchParams): ArtistDirectoryFilters {
  const category = searchParams.get('category')
  const gender = searchParams.get('gender')

  return {
    category: validCategories.includes(category as ArtistCategory) ? (category as ArtistCategory) : 'all',
    gender: validGenders.includes(gender as ArtistGender) ? (gender as ArtistGender) : 'all',
  }
}

export function buildArtistDirectoryHref(filters: Partial<ArtistDirectoryFilters>) {
  const params = new URLSearchParams()

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category)
  }

  if (filters.gender && filters.gender !== 'all') {
    params.set('gender', filters.gender)
  }

  const query = params.toString()
  return query ? `/nghe-si?${query}` : '/nghe-si'
}

export function matchesArtistSegmentRule(artist: ArtistProfile, rule: ArtistSegmentRule) {
  if (rule.category?.length && !rule.category.includes(artist.category)) return false
  if (rule.gender?.length && !rule.gender.includes(artist.gender)) return false
  if (rule.city?.length && !rule.city.includes(artist.location)) return false
  if (rule.slug?.length && !rule.slug.includes(artist.slug)) return false
  return true
}

export function filterArtistsByRule(artists: ArtistProfile[], rule: ArtistSegmentRule) {
  return artists.filter((artist) => matchesArtistSegmentRule(artist, rule))
}

export function filterArtistsByDirectoryFilters(artists: ArtistProfile[], filters: ArtistDirectoryFilters) {
  return filterArtistsByRule(artists, {
    category: filters.category === 'all' ? undefined : [filters.category],
    gender: filters.gender === 'all' ? undefined : [filters.gender],
  })
}

export const artistRankingSegments: ArtistSegmentDefinition[] = [
  {
    key: 'all-artists',
    label: 'All Artist',
    rule: {},
  },
  {
    key: 'miss-dj',
    label: 'Miss DJ',
    rule: {
      category: ['dj'],
      gender: ['female'],
    },
  },
  {
    key: 'top-male-dj',
    label: 'Top Nam DJ',
    rule: {
      category: ['dj'],
      gender: ['male'],
    },
  },
  {
    key: 'female-rapper',
    label: 'Nữ Rapper',
    rule: {
      category: ['rapper'],
      gender: ['female'],
    },
  },
]
