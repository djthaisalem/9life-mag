import 'server-only'

import type { Where } from 'payload'
import type { CmsMusicRow, CmsMusicTabKey } from '@/lib/cms-dashboard-data'
import { loadPayloadClient } from '@/lib/payload-runtime'

type TrackDocument = {
  id: string | number
  slug?: string
  title?: string
  musicCode?: string
  trackType?: string
  submittedArtistSlug?: string
  genreLabel?: string
  albumLabel?: string
  accessLevel?: string
  visibility?: string
  displayMap?: string
  durationLabel?: string
  playbackStarCost?: number
  downloadStarCost?: number
  masterR2Key?: string
  updatedAt?: string
}

export type CmsMusicLibraryRow = CmsMusicRow & {
  source: 'database'
  musicCode?: string
  masterR2Key?: string
  trackTypeValue: 'track' | 'nonstop' | 'remix' | 'album'
  accessLevelValue: 'public' | 'stars' | 'premium' | 'internal'
  visibilityValue: 'draft' | 'pending' | 'public' | 'hidden'
  albumLabel?: string
}

type EditableTrackType = CmsMusicLibraryRow['trackTypeValue']

const visibilityLabels: Record<string, string> = {
  draft: 'Nháp nội bộ',
  pending: 'Chờ admin duyệt',
  public: 'Đang public',
  hidden: 'Tạm ẩn',
}

const accessLabels: Record<string, string> = {
  public: 'Công khai',
  stars: 'Trừ sao để phát',
  premium: 'Chỉ Premium',
  internal: 'Chỉ nội bộ CMS',
}

function normalizeTrackType(value?: string): EditableTrackType {
  if (value === 'single') return 'track'
  if (value === 'nonstop' || value === 'remix' || value === 'album') return value
  return 'track'
}

function normalizeDatabaseTrack(doc: TrackDocument): CmsMusicLibraryRow {
  const trackTypeValue = normalizeTrackType(doc.trackType)
  const accessLevelValue = doc.accessLevel === 'stars' || doc.accessLevel === 'premium' || doc.accessLevel === 'internal'
    ? doc.accessLevel
    : 'public'
  const visibilityValue = doc.visibility === 'pending' || doc.visibility === 'public' || doc.visibility === 'hidden'
    ? doc.visibility
    : 'draft'

  return {
    id: String(doc.id),
    slug: doc.slug || String(doc.id),
    title: doc.title || 'Chưa đặt tên',
    type: trackTypeValue,
    artist: doc.submittedArtistSlug || 'Chưa gắn nghệ sĩ',
    genre: doc.genreLabel || 'Chưa phân loại',
    access: accessLabels[doc.accessLevel || ''] || doc.accessLevel || 'Công khai',
    visibility: visibilityLabels[doc.visibility || ''] || doc.visibility || 'Nháp nội bộ',
    mappedTo: doc.displayMap || 'Chưa map',
    updatedAt: doc.updatedAt || new Date(0).toISOString(),
    duration: doc.durationLabel || '00:00',
    playbackStarCost: doc.playbackStarCost || 0,
    downloadStarCost: doc.downloadStarCost || 0,
    source: 'database',
    musicCode: doc.musicCode,
    masterR2Key: doc.masterR2Key,
    trackTypeValue,
    accessLevelValue,
    visibilityValue,
    albumLabel: doc.albumLabel,
  }
}

function getDatabaseWhere(tab: CmsMusicTabKey, query: string) {
  const conditions: Where[] = []
  const trackType = tab === 'track' ? 'single' : tab === 'nonstop' || tab === 'remix' || tab === 'album' ? tab : ''

  if (trackType) {
    conditions.push({ trackType: { equals: trackType } })
  } else if (tab === 'playlist') {
    conditions.push({ id: { exists: false } })
  }

  if (query) {
    conditions.push({
      or: [
        { title: { like: query } },
        { musicCode: { like: query } },
        { submittedArtistSlug: { like: query } },
        { genreLabel: { like: query } },
      ],
    })
  }

  return conditions.length ? { and: conditions } : undefined
}

export async function getCmsMusicLibraryPage(input: {
  tab: CmsMusicTabKey
  query: string
  page: number
  pageSize: number
}) {
  const query = input.query.trim().slice(0, 100)
  const page = Math.max(1, input.page)

  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'tracks',
      where: getDatabaseWhere(input.tab, query),
      sort: '-updatedAt',
      page,
      limit: input.pageSize,
      depth: 0,
      overrideAccess: true,
    })

    return {
      rows: result.docs.map((doc) => normalizeDatabaseTrack(doc as TrackDocument)),
      totalItems: result.totalDocs,
      query,
    }
  } catch (error) {
    console.error('CMS music library database query failed', error)
    return {
      rows: [],
      totalItems: 0,
      query,
    }
  }
}

export async function getCmsMusicLibraryRowBySlug(slug: string): Promise<CmsMusicLibraryRow | null> {
  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'tracks',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (result.docs[0]) return normalizeDatabaseTrack(result.docs[0] as TrackDocument)
  } catch (error) {
    console.error('CMS music detail database query failed', error)
  }

  return null
}
