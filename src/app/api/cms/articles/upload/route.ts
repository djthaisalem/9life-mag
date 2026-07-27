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
    .replace(/^-+|-+$/g, '') || 'article-image'
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'content',
  )
  const access = capability ? { ok: true as const } : await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const alt = String(formData.get('alt') ?? 'Ảnh bài viết').trim().slice(0, 180) || 'Ảnh bài viết'

    if (!(file instanceof File) || !file.size || !file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, message: 'Ảnh phải là file image và không vượt quá 10MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const payload = await loadPayloadClient()
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
        url: `/api/public/media/${media.id}`,
        alt: media.alt || alt,
      },
    })
  } catch (error) {
    console.error('CMS article image upload failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể upload ảnh bài viết lúc này.' }, { status: 500 })
  }
}
