import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

import { env } from '@/lib/env'
import { getPublishedArtistDraftMedia } from '@/lib/public-artists'

function getR2Client() {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return null
  return new S3Client({ endpoint: env.R2_ENDPOINT, region: 'auto', forcePathStyle: true, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } })
}

export async function GET(_: Request, context: { params: Promise<{ artistId: string; field: string }> }) {
  const { artistId, field } = await context.params
  if (!/^\d+$/.test(artistId) || !['portraitUpload', 'coverUpload'].includes(field)) return new NextResponse(null, { status: 404 })
  try {
    const key = await getPublishedArtistDraftMedia(artistId, field as 'portraitUpload' | 'coverUpload')
    const client = getR2Client()
    if (!key || !client) return new NextResponse(null, { status: 404 })
    const object = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }))
    if (!object.Body) return new NextResponse(null, { status: 404 })
    return new NextResponse(await object.Body.transformToWebStream(), { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400', 'Content-Type': object.ContentType || 'image/jpeg' } })
  } catch (error) {
    console.error('Public artist image failed', error)
    return new NextResponse(null, { status: 404 })
  }
}
