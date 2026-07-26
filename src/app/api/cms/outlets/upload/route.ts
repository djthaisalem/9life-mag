import { NextResponse } from 'next/server'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { loadPayloadClient } from '@/lib/payload-runtime'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function toFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'outlet-image'
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'booking',
  )
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('booking')
  if (!access.ok) return access.response

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const alt = String(formData.get('alt') ?? 'Ảnh outlet').trim().slice(0, 180) || 'Ảnh outlet'
    if (!(file instanceof File) || !file.size || !file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, message: 'Ảnh phải là file image và không vượt quá 10MB.' }, { status: 400 })
    }

    const payload = await loadPayloadClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const media = await payload.create({
      collection: 'media',
      data: { alt, kind: 'image' },
      file: {
        data: buffer,
        mimetype: file.type,
        name: toFileName(file.name),
        size: buffer.length,
      },
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({
      ok: true,
      media: {
        id: String(media.id),
        // Media may be private in R2 or served through a CDN without public CORS.
        // The site proxy has R2 credentials and is safe for CMS image previews.
        url: `/api/public/media/${media.id}`,
        alt: media.alt || alt,
      },
    })
  } catch (error) {
    console.error('CMS outlet image upload failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể upload ảnh outlet lúc này.' }, { status: 500 })
  }
}
