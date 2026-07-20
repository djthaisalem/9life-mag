import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

const STORE_PATH = path.join(process.cwd(), 'data', 'artist-private-contacts.json')
const writeLocks = new Map<string, Promise<void>>()

export type ArtistPrivateContact = { email: string; phone: string; facebook: string; telegram: string; zalo: string; tiktok: string; updatedAt?: string }
const emptyContact = (): ArtistPrivateContact => ({ email: '', phone: '', facebook: '', telegram: '', zalo: '', tiktok: '' })

async function readStore() {
  try { return JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as Record<string, ArtistPrivateContact> } catch { return {} }
}

async function writeStore(store: Record<string, ArtistPrivateContact>) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  const temporaryPath = `${STORE_PATH}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8')
  await fs.rename(temporaryPath, STORE_PATH)
}

export async function getArtistPrivateContact(artistSlug: string) {
  return { ...emptyContact(), ...(await readStore())[artistSlug] }
}

export async function saveArtistPrivateContact(artistSlug: string, contact: Omit<ArtistPrivateContact, 'updatedAt'>) {
  const previous = writeLocks.get(artistSlug) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.then(() => current)
  writeLocks.set(artistSlug, queued)

  await previous
  try {
    const store = await readStore()
    const next = { ...emptyContact(), ...contact, updatedAt: new Date().toISOString() }
    await writeStore({ ...store, [artistSlug]: next })
    return next
  } finally {
    release()
    if (writeLocks.get(artistSlug) === queued) writeLocks.delete(artistSlug)
  }
}
