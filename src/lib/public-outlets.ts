import 'server-only'

import type { ClubOutlet, ClubOutletProfile } from '@/lib/club-booking-data'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { normalizeVietnamLocation, vietnamLocations, vietnamRegions, type VietnamRegionId } from '@/lib/vietnam-locations'

type MediaValue = { id?: string | number; alt?: string } | string | number | null | undefined

function mediaUrl(value: MediaValue) {
  const id = typeof value === 'object' && value ? value.id : value
  return id ? `/api/public/media/${id}` : '/icon.png'
}

function outletRegion(city: string, configuredRegion: string): { id: VietnamRegionId; label: ClubOutlet['regionLabel'] } {
  const location = vietnamLocations.find((item) => normalizeVietnamLocation(item.name) === normalizeVietnamLocation(city))
  const configured = vietnamRegions.find((item) => normalizeVietnamLocation(item.label) === normalizeVietnamLocation(configuredRegion))
  const region = location?.region ?? configured?.id ?? 'mien-nam'
  return { id: region, label: vietnamRegions.find((item) => item.id === region)!.label as ClubOutlet['regionLabel'] }
}

function lines(value: unknown, fallback: string[]) {
  const result = String(value ?? '').split(/\r?\n|•/).map((item) => item.trim()).filter(Boolean)
  return result.length ? result : fallback
}

function faqPairs(value: unknown) {
  const values = lines(value, [])
  const pairs: Array<{ question: string; answer: string }> = []
  for (let index = 0; index < values.length; index += 2) {
    const question = values[index]
    const answer = values[index + 1]
    if (question) pairs.push({ question, answer: answer || 'Outlet đang cập nhật câu trả lời.' })
  }
  return pairs
}

function mapOutlet(document: Record<string, unknown>) {
  const region = outletRegion(String(document.city ?? ''), String(document.region ?? ''))
  const outlet: ClubOutlet = {
    slug: String(document.slug),
    name: String(document.name),
    city: String(document.city || 'Đang cập nhật'),
    regionId: region.id,
    regionLabel: region.label,
    type: String(document.type || 'Nightlife outlet'),
    hours: String(document.hours || 'Đang cập nhật'),
    crowd: String(document.crowd || 'Đang cập nhật'),
    image: mediaUrl(document.portraitImage as MediaValue),
    cover: mediaUrl(document.coverImage as MediaValue),
    vibe: String(document.vibe || 'Nightlife experience'),
    summary: String(document.summary || 'Outlet đang cập nhật nội dung trải nghiệm.'),
  }
  const gallery = Array.isArray(document.gallery) ? document.gallery : []
  const profile: ClubOutletProfile = {
    introduction: lines(document.introduction, [outlet.summary]),
    highlights: lines(document.highlights, ['Đang cập nhật điểm mạnh nightlife.']),
    tableOptions: lines(document.tableOptions, ['Đang cập nhật loại bàn và package.']),
    musicStyles: lines(document.musicStyles, ['Đang cập nhật music mood.']),
    serviceNotes: lines(document.serviceNotes, ['Đang cập nhật lưu ý dịch vụ.']),
    gallery: gallery.map((media) => ({ image: mediaUrl(media as MediaValue), caption: (media as { alt?: string })?.alt || outlet.name })),
    faq: faqPairs(document.faq),
    stats: [
      { label: 'Khu vực', value: outlet.city },
      { label: 'Giờ hoạt động', value: outlet.hours },
      { label: 'Quy mô bàn', value: outlet.crowd },
      { label: 'Định vị', value: outlet.type },
    ],
  }
  return { outlet, profile }
}

export async function listPublishedOutlets() {
  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: 'outlet-profiles',
    where: { status: { equals: 'published' } },
    depth: 1,
    limit: 200,
    sort: '-updatedAt',
    overrideAccess: true,
  })
  return result.docs.map((document) => mapOutlet(document as Record<string, unknown>))
}

export async function getPublishedOutletProfileBySlug(slug: string) {
  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: 'outlet-profiles',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return result.docs[0] ? mapOutlet(result.docs[0] as Record<string, unknown>) : null
}
