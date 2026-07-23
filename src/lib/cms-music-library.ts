import 'server-only'

import type { Where } from 'payload'
import { cmsMusicRows, type CmsMusicRow, type CmsMusicTabKey } from '@/lib/cms-dashboard-data'
import { loadPayloadClient } from '@/lib/payload-runtime'

type TrackDocument = {
  id: string | number
  slug?: string
  title?: string
  musicCode?: string
  trackType?: string
  submittedArtistSlug?: string
  genreLabel?: string
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
  source: 'database' | 'sample'
  musicCode?: string
  masterR2Key?: string
}

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

function normalizeTrackType(value?: string): CmsMusicRow['type'] {
  if (value === 'single') return 'track'
  if (value === 'nonstop' || value === 'remix' || value === 'album') return value
  return 'track'
}

function normalizeDatabaseTrack(doc: TrackDocument): CmsMusicLibraryRow {
  return {
    id: String(doc.id),
    slug: doc.slug || String(doc.id),
    title: doc.title || 'Chưa đặt tên',
    type: normalizeTrackType(doc.trackType),
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
  }
}

function matchesQuery(row: CmsMusicRow, query: string) {
  if (!query) return true
  const haystack = `${row.title} ${row.artist} ${row.genre} ${row.slug}`.toLocaleLowerCase('vi-VN')
  return haystack.includes(query.toLocaleLowerCase('vi-VN'))
}

function getSampleRows(tab: CmsMusicTabKey, query: string): CmsMusicLibraryRow[] {
  return cmsMusicRows
    .filter((row) => tab === 'all' || row.type === tab)
    .filter((row) => matchesQuery(row, query))
    .map((row) => ({ ...row, source: 'sample' as const }))
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
  const sampleRows = getSampleRows(input.tab, query)

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

    const databaseRows = result.docs.map((doc) => normalizeDatabaseTrack(doc as TrackDocument))
    const startIndex = (page - 1) * input.pageSize
    const sampleStart = Math.max(0, startIndex - result.totalDocs)
    const remaining = Math.max(0, input.pageSize - databaseRows.length)

    return {
      rows: [...databaseRows, ...sampleRows.slice(sampleStart, sampleStart + remaining)],
      totalItems: result.totalDocs + sampleRows.length,
      query,
    }
  } catch (error) {
    console.error('CMS music library database query failed', error)
    const startIndex = (page - 1) * input.pageSize
    return {
      rows: sampleRows.slice(startIndex, startIndex + input.pageSize),
      totalItems: sampleRows.length,
      query,
    }
  }
}

export async function getCmsMusicLibraryRowBySlug(slug: string) {
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

  const sample = cmsMusicRows.find((row) => row.slug === slug)
  return sample ? { ...sample, source: 'sample' as const } : null
}
