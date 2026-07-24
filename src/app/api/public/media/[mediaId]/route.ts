import { NextResponse } from 'next/server'

import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPrivateObjectUrl } from '@/lib/r2-media-access'

type MediaDocument = {
  filename?: string | null
  kind?: string | null
  prefix?: string | null
}

export async function GET(_: Request, context: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await context.params
  if (!/^\d+$/.test(mediaId)) return new NextResponse(null, { status: 404 })

  try {
    const payload = await loadPayloadClient()
    const media = await payload.findByID({ collection: 'media', id: mediaId, depth: 0, overrideAccess: true }) as MediaDocument
    if (media.kind !== 'image' || !media.filename) return new NextResponse(null, { status: 404 })

    const prefix = media.prefix?.trim().replace(/^\/+|\/+$/g, '')
    const key = prefix ? `${prefix}/${media.filename}` : `media/${media.filename}`
    const url = await getPrivateObjectUrl(key, 60 * 30)
    return NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (error) {
    console.error('Public media image failed', error)
    return new NextResponse(null, { status: 404 })
  }
}
