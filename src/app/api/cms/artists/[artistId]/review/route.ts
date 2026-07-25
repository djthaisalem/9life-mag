import { NextResponse } from 'next/server'
import { z } from 'zod'

import { hasTrustedCmsRequestOrigin, requireCmsApiAccess } from '@/lib/cms-access'
import { loadPayloadClient } from '@/lib/payload-runtime'

const reviewSchema = z.object({
  profileStatus: z.enum(['draft', 'pending_review', 'published', 'archived']),
})

export async function PATCH(request: Request, context: { params: Promise<{ artistId: string }> }) {
  if (!await hasTrustedCmsRequestOrigin()) {
    return NextResponse.json({ ok: false, message: 'Origin khong hop le.' }, { status: 403 })
  }

  const access = await requireCmsApiAccess('artists')
  if (!access.ok) return access.response

  try {
    const { artistId } = await context.params
    const input = reviewSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const artist = await payload.update({
      collection: 'artists',
      id: artistId,
      data: { profileStatus: input.profileStatus },
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true, artist: { id: artist.id, profileStatus: artist.profileStatus } })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Trang thai ho so khong hop le.'
      : 'Khong the cap nhat trang thai ho so luc nay.'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
