import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { loadPayloadClient } from '@/lib/payload-runtime'

const outletSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2).max(180),
  status: z.enum(['draft', 'pending_review', 'published', 'cancelled']).default('draft'),
  type: z.string().trim().max(120).default(''),
  region: z.string().trim().max(80).default(''),
  city: z.string().trim().max(120).default(''),
  hours: z.string().trim().max(120).default(''),
  crowd: z.string().trim().max(120).default(''),
  vibe: z.string().trim().max(240).default(''),
  summary: z.string().trim().max(1200).default(''),
  introduction: z.string().trim().max(4000).default(''),
  highlights: z.string().trim().max(2400).default(''),
  tableOptions: z.string().trim().max(2400).default(''),
  serviceNotes: z.string().trim().max(2400).default(''),
  musicStyles: z.string().trim().max(1200).default(''),
  faq: z.string().trim().max(2400).default(''),
  videoEmbed: z.string().trim().max(1200).default(''),
  audioEmbed: z.string().trim().max(1200).default(''),
  bookingChannel: z.string().trim().max(160).default(''),
  coverImage: z.coerce.number().int().positive().nullable().optional(),
  portraitImage: z.coerce.number().int().positive().nullable().optional(),
  gallery: z.array(z.coerce.number().int().positive()).max(20).default([]),
})

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (character) => character === 'đ' ? 'd' : 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'outlet'
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
    const input = outletSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const data = {
      name: input.name,
      status: input.status,
      type: input.type || undefined,
      region: input.region || undefined,
      city: input.city || undefined,
      hours: input.hours || undefined,
      crowd: input.crowd || undefined,
      vibe: input.vibe || undefined,
      summary: input.summary || undefined,
      introduction: input.introduction || undefined,
      highlights: input.highlights || undefined,
      tableOptions: input.tableOptions || undefined,
      serviceNotes: input.serviceNotes || undefined,
      musicStyles: input.musicStyles || undefined,
      faq: input.faq || undefined,
      videoEmbed: input.videoEmbed || undefined,
      audioEmbed: input.audioEmbed || undefined,
      bookingChannel: input.bookingChannel || undefined,
      coverImage: input.coverImage ?? undefined,
      portraitImage: input.portraitImage ?? undefined,
      gallery: input.gallery,
      seoTitle: input.name,
      seoDescription: input.summary || undefined,
    }

    if (input.id) {
      const outlet = await payload.update({
        collection: 'outlet-profiles',
        id: input.id,
        data,
        depth: 1,
        overrideAccess: true,
      })
      return NextResponse.json({ ok: true, outlet })
    }

    const baseSlug = toSlug(input.name)
    const existing = await payload.find({
      collection: 'outlet-profiles',
      where: { slug: { equals: baseSlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const outlet = await payload.create({
      collection: 'outlet-profiles',
      data: {
        ...data,
        slug: existing.docs.length ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug,
        createdByEmail: access.session.email,
      },
      depth: 1,
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true, outlet })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? 'Thông tin outlet chưa hợp lệ.'
      : 'Không thể lưu outlet lúc này.'
    console.error('CMS outlet save failed', error)
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
