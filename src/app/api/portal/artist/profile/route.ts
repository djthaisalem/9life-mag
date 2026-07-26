import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { completeArtistProfileOnboarding, setArtistProfileSlug } from '@/lib/site-user-session'
import { sendTelegramOperationsNotice } from '@/lib/telegram'
import { saveArtistProfileDraft, storeArtistDraftImages, type ArtistProfileDraft } from '@/lib/artist-profile-draft-store'

const profileSchema = z.object({
  artistName: z.string().trim().min(2).max(120),
  headline: z.string().trim().max(180).optional().default(''),
  shortBio: z.string().trim().max(1_200).optional().default(''),
  primaryRole: z.enum(['DJ Producer', 'MC Hype', 'Rapper', 'Dancer', 'Photographer', 'Singer']).optional(),
  bookingRate: z.string().trim().max(120).optional().default(''),
  availability: z.string().trim().max(120).optional().default(''),
  submitForReview: z.boolean().optional().default(false),
  profileSnapshot: z.record(z.string(), z.object({ values: z.record(z.string(), z.string()).optional(), files: z.record(z.string(), z.string()).optional() })).optional(),
})

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (character) => character === 'đ' ? 'd' : 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'artist'
}

function toCatalogRole(primaryRole?: z.infer<typeof profileSchema>['primaryRole']) {
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
    const isReadyForReview = Boolean(input.headline && input.shortBio.length >= 20 && input.primaryRole)
    const profileStatus = current?.profileStatus === 'published'
      ? 'published'
      : input.submitForReview && isReadyForReview
        ? 'pending_review'
        : current?.profileStatus === 'pending_review'
          ? 'pending_review'
          : 'draft'
    const data = {
      stageName: input.artistName,
      slug,
      role: toCatalogRole(input.primaryRole),
      genres: input.primaryRole ? [{ value: input.primaryRole }] : [],
      bookingPriceLabel: input.bookingRate || undefined,
      isAvailable: !/tạm ngưng|unavailable|không nhận/i.test(input.availability),
      seoTitle: input.headline,
      seoDescription: input.shortBio,
      profileStatus,
    }

    const artistRecord = current
      ? await payload.update({ collection: 'artists', id: String(current.id), data, depth: 0, overrideAccess: true })
      : await payload.create({ collection: 'artists', data, depth: 0, overrideAccess: true })

    let draftMediaWarning = ''
    let profileDraft = input.profileSnapshot as ArtistProfileDraft | undefined
    if (profileDraft) {
      // Text must never be lost just because an optional media upload fails.
      await saveArtistProfileDraft(slug, profileDraft)
      try {
        profileDraft = await storeArtistDraftImages(slug, profileDraft)
        await saveArtistProfileDraft(slug, profileDraft)
      } catch (mediaError) {
        draftMediaWarning = mediaError instanceof Error ? mediaError.message : 'Không thể đồng bộ ảnh hồ sơ lên R2.'
        console.error('Artist draft image upload failed', mediaError)
      }
      await payload.update({
        collection: 'artists',
        id: String(artistRecord.id),
        data: { profileDraft },
        depth: 0,
        overrideAccess: true,
      })
    }

    await setArtistProfileSlug(account.id, slug)
    const reward = isReadyForReview
      ? await completeArtistProfileOnboarding(account.id)
      : { ok: true, awarded: false, state: { stars: account.stars } }
    if (!reward.ok) throw new Error('Không thể hoàn tất phần thưởng hồ sơ.')

    let cmsNotified = false
    let telegramNotified = false
    let telegramReason = ''
    if (input.submitForReview && isReadyForReview) {
      const isPublishedUpdate = current?.profileStatus === 'published'
      try {
        await createPortalNotifications([
        {
          recipientKey: 'admin',
          title: isPublishedUpdate ? 'Nghệ sĩ vừa cập nhật hồ sơ' : 'Hồ sơ nghệ sĩ chờ duyệt',
          body: isPublishedUpdate
            ? `${input.artistName} vừa gửi bản cập nhật profile. Vui lòng kiểm tra thay đổi trong CMS.`
            : `${input.artistName} vừa gửi hồ sơ để duyệt. Vui lòng kiểm tra trước khi public ngoài site.`,
          href: '/cms/dashboard/artists',
        },
        ])
        cmsNotified = true
      } catch (notificationError) {
        console.error('Could not create artist profile review notification', notificationError)
      }
      try {
        const telegram = await sendTelegramOperationsNotice([
        isPublishedUpdate ? '9LIFE MAG - HO SO NGHE SI CAP NHAT' : '9LIFE MAG - HO SO NGHE SI CHO DUYET',
        `Nghe si: ${input.artistName}`,
        `Vai tro: ${input.primaryRole}`,
        isPublishedUpdate ? 'Vui long kiem tra ban cap nhat trong CMS / Quan ly Nghe si.' : 'Vui long kiem tra va duyet trong CMS / Quan ly Nghe si.',
        ].join('\n'))
        telegramNotified = telegram.ok
        telegramReason = telegram.ok ? '' : (telegram.reason ?? 'Telegram notification was not delivered')
        if (!telegram.ok) console.error('Artist profile review Telegram notice was not delivered', telegram)
      } catch (notificationError) {
        telegramReason = notificationError instanceof Error ? notificationError.message : 'Telegram notification failed'
        console.error('Could not send artist profile review Telegram notification', notificationError)
      }
    }

    return NextResponse.json({
      ok: true,
      slug,
      profileStatus,
      awarded: reward.awarded,
      stars: reward.state.stars,
      draftMediaWarning,
      cmsNotified,
      telegramNotified,
      telegramReason,
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
