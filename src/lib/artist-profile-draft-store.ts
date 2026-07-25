import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

export type ArtistDraftTemplate = { values?: Record<string, string>; files?: Record<string, string> }
export type ArtistProfileDraft = Record<string, ArtistDraftTemplate>

const draftDirectory = path.join(process.cwd(), 'data', 'artist-profile-drafts')

function safeSlug(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, '').slice(0, 100) || 'artist'
}

export async function saveArtistProfileDraft(slug: string, draft: ArtistProfileDraft) {
  await fs.mkdir(draftDirectory, { recursive: true })
  await fs.writeFile(path.join(draftDirectory, `${safeSlug(slug)}.json`), JSON.stringify(draft), 'utf8')
}

export async function getArtistProfileDraft(slug: string): Promise<ArtistProfileDraft> {
  try {
    return JSON.parse(await fs.readFile(path.join(draftDirectory, `${safeSlug(slug)}.json`), 'utf8')) as ArtistProfileDraft
  } catch {
    return {}
  }
}
