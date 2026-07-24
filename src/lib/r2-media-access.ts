import 'server-only'

import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/lib/env'

function getClient() {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return null
  return new S3Client({
    endpoint: env.R2_ENDPOINT,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  })
}

export async function getPreviewPlaybackUrl(key: string) {
  if (!key.startsWith('music/preview/') && !key.startsWith('music/master/')) throw new Error('invalid_playback_key')
  // Preview URLs must remain private when playback can consume stars.
  // A public CDN URL can be copied and reused without passing access checks.
  return getPrivateObjectUrl(key, 60 * 30)
}

function buildAttachmentDisposition(filename: string) {
  const normalized = filename.replace(/[\r\n"]/g, '').trim() || '9life-music-download'
  const asciiFilename = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '_')
  return `attachment; filename="${asciiFilename || '9life-music-download'}"`
}

export async function assertPrivateObjectReadable(key: string) {
  const client = getClient()
  if (!client) throw new Error('r2_media_not_configured')

  const object = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
  if (!object.ContentLength || object.ContentLength < 1) throw new Error('r2_media_object_empty')
}

export async function getPrivateObjectUrl(key: string, expiresIn: number, options?: { downloadFilename?: string }) {
  const client = getClient()
  if (!client) throw new Error('r2_media_not_configured')
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ...(options?.downloadFilename
        ? {
            ResponseContentDisposition: buildAttachmentDisposition(options.downloadFilename),
          }
        : {}),
    }),
    { expiresIn },
  )
}
