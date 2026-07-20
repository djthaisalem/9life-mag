import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { getArtistAgencyBySlug, type ArtistAgencyProfile } from '@/lib/artist-agency-data'
import { loadPayloadClient } from '@/lib/payload-runtime'

export type ArtistAgencyProfileUpdate = Pick<ArtistAgencyProfile, 'label' | 'location' | 'coverage' | 'image' | 'description' | 'specialties' | 'services'>
type StoredArtistAgency = ArtistAgencyProfile & { updatedAt: string }
const storePath = path.join(process.cwd(), 'data', 'artist-agencies.json')

async function readStore() {
  try { return JSON.parse(await fs.readFile(storePath, 'utf8')) as StoredArtistAgency[] } catch { return [] }
}

async function writeStore(rows: StoredArtistAgency[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(rows, null, 2), 'utf8')
}

function arrayValues(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => typeof item === 'string' ? item : typeof item === 'object' && item ? String((item as Record<string, unknown>).value ?? '') : '').map((item) => item.trim()).filter(Boolean)
}

function merge(base: ArtistAgencyProfile, override?: Partial<ArtistAgencyProfile>) {
  return { ...base, ...override, specialties: override?.specialties?.length ? override.specialties : base.specialties, services: override?.services?.length ? override.services : base.services }
}

function normalizePayloadAgency(value: Record<string, unknown>) {
  return {
    slug: String(value.slug ?? ''),
    name: String(value.name ?? ''),
    label: String(value.label ?? ''),
    location: String(value.location ?? ''),
    coverage: String(value.coverage ?? ''),
    image: String(value.image ?? ''),
    description: String(value.description ?? ''),
    specialties: arrayValues(value.specialties),
    services: arrayValues(value.services),
  } satisfies ArtistAgencyProfile
}

export async function getStoredArtistAgency(slug: string) {
  const base = getArtistAgencyBySlug(slug)
  if (!base) return undefined
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'artist-agencies', where: { slug: { equals: slug } }, limit: 1, depth: 0, pagination: false })
    const override = result.docs[0] ? normalizePayloadAgency(result.docs[0] as Record<string, unknown>) : undefined
    return merge(base, override)
  }
  const override = (await readStore()).find((item) => item.slug === slug)
  return merge(base, override)
}

export async function updateStoredArtistAgency(slug: string, input: ArtistAgencyProfileUpdate) {
  const base = getArtistAgencyBySlug(slug)
  if (!base) return undefined
  const next = merge(base, input)
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const current = await payload.find({ collection: 'artist-agencies', where: { slug: { equals: slug } }, limit: 1, depth: 0, pagination: false })
    const data = { ...next, specialties: next.specialties.map((value) => ({ value })), services: next.services.map((value) => ({ value })) }
    if (current.docs[0]) await payload.update({ collection: 'artist-agencies', id: String((current.docs[0] as Record<string, unknown>).id), data })
    else await payload.create({ collection: 'artist-agencies', data })
    return next
  }
  const rows = await readStore()
  const record: StoredArtistAgency = { ...next, updatedAt: new Date().toISOString() }
  const index = rows.findIndex((item) => item.slug === slug)
  if (index >= 0) rows[index] = record
  else rows.push(record)
  await writeStore(rows)
  return next
}
