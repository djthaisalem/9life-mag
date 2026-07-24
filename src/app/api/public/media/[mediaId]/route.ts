import { NextResponse } from 'next/server'

import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPrivateObjectUrl } from '@/lib/r2-media-access'
import { env } from '@/lib/env'

type MediaDocument = {
  filename?: string | null
  kind?: string | null
  prefix?: string | null
  url?: string | null
}

function getObjectKey(media: MediaDocument) {
  if (media.url) {
    try {
      const pathname = decodeURIComponent(new URL(media.url).pathname)
      const bucketPath = `/${env.R2_BUCKET}/`
      const bucketIndex = pathname.indexOf(bucketPath)
      if (bucketIndex >= 0) return pathname.slice(bucketIndex + bucketPath.length)
    } catch {
      // Fall back to the storage prefix fields below.
    }
  }

  const prefix = media.prefix?.trim().replace(/^\/+|\/+$/g, '')
  return prefix ? `${prefix}/${media.filename}` : `media/${media.filename}`
}

export async function GET(_: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params
  if (!/^\d+$/.test(mediaId)) return new NextResponse(null, { status: 404 })

  try {
    const payload = await loadPayloadClient()
    const media = await payload.findByID({ collection: 'media', id: mediaId, depth: 0, overrideAccess: true }) as MediaDocument
    if (!media.filename) return new NextResponse(null, { status: 404 })

    const key = getObjectKey(media)
    const url = await getPrivateObjectUrl(key, 60 * 30)
    return NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (error) {
    console.error('Public media image failed', error)
    return new NextResponse(null, { status: 404 })
  }
}
