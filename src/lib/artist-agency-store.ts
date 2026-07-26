import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { getArtistAgencies, getArtistAgencyBySlug, type ArtistAgencyProfile } from '@/lib/artist-agency-data'
import { loadPayloadClient } from '@/lib/payload-runtime'

export type ArtistAgencyStatus = 'pending_review' | 'published' | 'suspended' | 'cancelled'
export type ArtistAgencyProfileUpdate = Pick<ArtistAgencyProfile, 'label' | 'location' | 'coverage' | 'image' | 'description' | 'specialties' | 'services'>
export type StoredArtistAgency = ArtistAgencyProfile & { status: ArtistAgencyStatus; updatedAt?: string }
const storePath = path.join(process.cwd(), 'data', 'artist-agencies.json')

async function readStore() { try { return JSON.parse(await fs.readFile(storePath, 'utf8')) as StoredArtistAgency[] } catch { return [] } }
async function writeStore(rows: StoredArtistAgency[]) { await fs.mkdir(path.dirname(storePath), { recursive: true }); await fs.writeFile(storePath, JSON.stringify(rows, null, 2), 'utf8') }
function values(value: unknown) { return Array.isArray(value) ? value.map((item) => typeof item === 'string' ? item : String((item as { value?: string })?.value ?? '')).map((item) => item.trim()).filter(Boolean) : [] }
function status(value: unknown): ArtistAgencyStatus { return ['pending_review', 'suspended', 'cancelled'].includes(String(value)) ? String(value) as ArtistAgencyStatus : 'published' }
function normalize(value: Record<string, unknown>): StoredArtistAgency { return { slug: String(value.slug ?? ''), name: String(value.name ?? ''), label: String(value.label ?? ''), location: String(value.location ?? ''), coverage: String(value.coverage ?? ''), image: String(value.image ?? ''), description: String(value.description ?? ''), specialties: values(value.specialties), services: values(value.services), status: status(value.status), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined } }
function merge(base: ArtistAgencyProfile, row?: Partial<StoredArtistAgency>): StoredArtistAgency { return { ...base, ...row, specialties: row?.specialties?.length ? row.specialties : base.specialties, services: row?.services?.length ? row.services : base.services, status: row?.status ?? 'published' } }
function payloadData(row: StoredArtistAgency) { return { ...row, specialties: row.specialties.map((value) => ({ value })), services: row.services.map((value) => ({ value })) } }

export async function listStoredArtistAgencies() {
  const rows = env.SITE_USER_STORAGE_DRIVER === 'payload'
    ? (() => loadPayloadClient().then(async (payload) => (await payload.find({ collection: 'artist-agencies', limit: 200, depth: 0, pagination: false, sort: '-updatedAt' })).docs.map((doc) => normalize(doc as Record<string, unknown>))))()
    : readStore()
  const stored = await rows
  const bySlug = new Map(stored.map((row) => [row.slug, row]))
  return [...getArtistAgencies().map((agency) => merge(agency, bySlug.get(agency.slug))), ...stored.filter((row) => !getArtistAgencyBySlug(row.slug))]
}

export async function getStoredArtistAgency(slug: string) { return (await listStoredArtistAgencies()).find((agency) => agency.slug === slug) }

export async function updateStoredArtistAgency(slug: string, input: ArtistAgencyProfileUpdate) {
  const current = await getStoredArtistAgency(slug)
  if (!current) return undefined
  const next: StoredArtistAgency = { ...current, ...input }
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient(); const currentDoc = await payload.find({ collection: 'artist-agencies', where: { slug: { equals: slug } }, limit: 1, depth: 0, pagination: false })
    if (currentDoc.docs[0]) await payload.update({ collection: 'artist-agencies', id: String((currentDoc.docs[0] as Record<string, unknown>).id), data: payloadData(next) })
    else await payload.create({ collection: 'artist-agencies', data: payloadData(next) })
  } else { const rows = await readStore(); const index = rows.findIndex((row) => row.slug === slug); if (index >= 0) rows[index] = next; else rows.push(next); await writeStore(rows) }
  return next
}

export async function createStoredArtistAgency(input: ArtistAgencyProfile) {
  const next: StoredArtistAgency = { ...input, status: 'pending_review', updatedAt: new Date().toISOString() }
  if (await getStoredArtistAgency(next.slug)) throw new Error('agency-slug-exists')
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') { const payload = await loadPayloadClient(); await payload.create({ collection: 'artist-agencies', data: payloadData(next) }) }
  else { const rows = await readStore(); await writeStore([next, ...rows]) }
  return next
}

export async function updateStoredArtistAgencyStatus(slug: string, nextStatus: ArtistAgencyStatus) {
  const current = await getStoredArtistAgency(slug); if (!current) return undefined
  return updateStoredArtistAgency(slug, { label: current.label, location: current.location, coverage: current.coverage, image: current.image, description: current.description, specialties: current.specialties, services: current.services }).then(async (updated) => {
    if (!updated) return undefined
    const next = { ...updated, status: nextStatus }
    if (env.SITE_USER_STORAGE_DRIVER === 'payload') { const payload = await loadPayloadClient(); const doc = await payload.find({ collection: 'artist-agencies', where: { slug: { equals: slug } }, limit: 1, depth: 0, pagination: false }); await payload.update({ collection: 'artist-agencies', id: String((doc.docs[0] as Record<string, unknown>).id), data: payloadData(next) }) }
    else { const rows = await readStore(); const index = rows.findIndex((row) => row.slug === slug); rows[index] = next; await writeStore(rows) }
    return next
  })
}
