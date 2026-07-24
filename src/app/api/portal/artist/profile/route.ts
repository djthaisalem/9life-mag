import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { completeArtistProfileOnboarding, setArtistProfileSlug } from '@/lib/site-user-session'

const profileSchema = z.object({
  artistName: z.string().trim().min(2).max(120),
  headline: z.string().trim().min(4).max(180),
  shortBio: z.string().trim().min(20).max(1_200),
  primaryRole: z.enum(['DJ Producer', 'MC Hype', 'Rapper', 'Dancer', 'Photographer', 'Singer']),
  bookingRate: z.string().trim().max(120).optional().default(''),
  availability: z.string().trim().max(120).optional().default(''),
})

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'artist'
}

function toCatalogRole(primaryRole: z.infer<typeof profileSchema>['primaryRole']) {
  if (primaryRole === 'DJ Producer') return 'producer'
  if (primaryRole === 'MC Hype') return 'mc'
  if (primaryRole === 'Rapper') return 'rapper'
  if (primaryRole === 'Dancer') return 'dancer'
  return 'live-act'
}

export async function POST(request: Request) {
  const account = await getArtistPortalApiAccess('artist')
  if (!account) {
    return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập dashboard nghệ sĩ để lưu hồ sơ.' }, { status: 401 })
  }

  try {
    const input = profileSchema.parse(await request.json())
    const payload = await loadPayloadClient()
    const slug = account.artistProfileSlug || `${toSlug(input.artistName)}-${String(account.id).replace(/[^a-z0-9]/gi, '').slice(-8)}`
    const existing = await payload.find({
      collection: 'artists',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    const current = existing.docs[0] as Record<string, unknown> | undefined
    const data = {
      stageName: input.artistName,
      slug,
      role: toCatalogRole(input.primaryRole),
      genres: [{ value: input.primaryRole }],
      bookingPriceLabel: input.bookingRate || undefined,
      isAvailable: !/tạm ngưng|unavailable|không nhận/i.test(input.availability),
      seoTitle: input.headline,
      seoDescription: input.shortBio,
      managedBy: account.id,
      profileStatus: current?.profileStatus === 'published' ? 'published' : 'pending_review',
    }

    if (current) {
      await payload.update({ collection: 'artists', id: String(current.id), data, depth: 0, overrideAccess: true })
    } else {
      await payload.create({ collection: 'artists', data, depth: 0, overrideAccess: true })
    }

    await setArtistProfileSlug(account.id, slug)
    const reward = await completeArtistProfileOnboarding(account.id)
    if (!reward.ok) throw new Error('Không thể hoàn tất phần thưởng hồ sơ.')

    try {
      await createPortalNotifications([
        {
          recipientKey: 'admin',
          title: 'Hồ sơ nghệ sĩ chờ duyệt',
          body: `${input.artistName} vừa hoàn tất hồ sơ cơ bản. Vui lòng kiểm tra và duyệt trước khi public ngoài site.`,
          href: '/cms/dashboard/artists',
        },
      ])
    } catch (notificationError) {
      console.error('Could not create artist profile review notification', notificationError)
    }

    return NextResponse.json({
      ok: true,
      slug,
      profileStatus: current?.profileStatus === 'published' ? 'published' : 'pending_review',
      awarded: reward.awarded,
      stars: reward.state.stars,
    })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? 'Thông tin hồ sơ chưa hợp lệ.'
      : error instanceof Error
        ? error.message
        : 'Không thể lưu hồ sơ lúc này.'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
