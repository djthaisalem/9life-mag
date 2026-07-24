import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

type MediaDocument = {
  filename?: string | null
  prefix?: string | null
  url?: string | null
}

function getCandidateKeys(media: MediaDocument) {
  const keys: string[] = []
  if (media.url) {
    try {
      const pathname = decodeURIComponent(new URL(media.url).pathname)
      const bucketPath = `/${env.R2_BUCKET}/`
      const bucketIndex = pathname.indexOf(bucketPath)
      if (bucketIndex >= 0) keys.push(pathname.slice(bucketIndex + bucketPath.length))
    } catch {
      // The document may contain a local URL. The storage fields below remain valid.
    }
  }

  const prefix = media.prefix?.trim().replace(/^\/+|\/+$/g, '')
  if (prefix) keys.push(`${prefix}/${media.filename}`)
  keys.push(`media/${media.filename}`, String(media.filename))
  return [...new Set(keys.filter(Boolean))]
}

function getR2Client() {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return null
  return new S3Client({
    endpoint: env.R2_ENDPOINT,
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  })
}

export async function GET(_: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params
  if (!/^\d+$/.test(mediaId)) return new NextResponse(null, { status: 404 })

  try {
    const payload = await loadPayloadClient()
    const media = await payload.findByID({ collection: 'media', id: mediaId, depth: 0, overrideAccess: true }) as MediaDocument
    const client = getR2Client()
    if (!media.filename || !client) return new NextResponse(null, { status: 404 })

    for (const key of getCandidateKeys(media)) {
      try {
        const object = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
        if (!object.Body) continue
        const body = await object.Body.transformToWebStream()
        return new NextResponse(body, {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'Content-Type': object.ContentType || 'image/jpeg',
          },
        })
      } catch (error) {
        const code = error as { name?: string; $metadata?: { httpStatusCode?: number } }
        if (code.name !== 'NoSuchKey' && code.$metadata?.httpStatusCode !== 404) throw error
      }
    }

    return new NextResponse(null, { status: 404 })
  } catch (error) {
    console.error('Public media image failed', error)
    return new NextResponse(null, { status: 404 })
  }
}
