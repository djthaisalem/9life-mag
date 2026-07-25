import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '@/lib/env'

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

function getR2Client() {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 chưa đủ cấu hình để lưu ảnh hồ sơ.')
  }
  return new S3Client({
    endpoint: env.R2_ENDPOINT,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  })
}

function parseDataImage(value: string) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i)
  if (!match) return null
  return { contentType: match[1], body: Buffer.from(match[2], 'base64') }
}

export async function storeArtistDraftImages(slug: string, draft: ArtistProfileDraft) {
  const next = JSON.parse(JSON.stringify(draft)) as ArtistProfileDraft
  const client = getR2Client()
  const normalizedSlug = safeSlug(slug)

  for (const template of Object.values(next)) {
    for (const field of ['portraitUpload', 'coverUpload']) {
      const value = template.files?.[field]
      if (!value) continue
      const image = parseDataImage(value)
      if (!image) continue

      const key = `artist-drafts/${normalizedSlug}/${field}.jpg`
      await client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: image.body,
        ContentType: image.contentType,
        CacheControl: 'private, max-age=300',
      }))
      template.files = { ...(template.files ?? {}), [field]: key }
    }
  }

  return next
}

export async function deleteArtistDraftImages(slug: string) {
  const client = getR2Client()
  const normalizedSlug = safeSlug(slug)
  await Promise.all(['portraitUpload', 'coverUpload'].map((field) => client.send(new DeleteObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: `artist-drafts/${normalizedSlug}/${field}.jpg`,
  }))))
}

export async function getArtistProfileDraft(slug: string): Promise<ArtistProfileDraft> {
  try {
    return JSON.parse(await fs.readFile(path.join(draftDirectory, `${safeSlug(slug)}.json`), 'utf8')) as ArtistProfileDraft
  } catch {
    return {}
  }
}
