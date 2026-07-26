import 'server-only'

import type { ArtistProfile, ArtistRichContent } from '@/lib/artist-directory-data'
import type { ArtistProfileDraft } from '@/lib/artist-profile-draft-store'
import { getMediaEmbed } from '@/lib/media-embed'
import { loadPayloadClient } from '@/lib/payload-runtime'

type ArtistDocument = Record<string, unknown>
const defaultImage = '/images/default-music-cover.png'

function draftValue(draft: ArtistProfileDraft, name: string) {
  return Object.values(draft).map((template) => template.values?.[name] ?? template.files?.[name] ?? '').find(Boolean) ?? ''
}

function lines(value: string, fallback: string[]) {
  const items = value.split(/\r?\n|•/).map((item) => item.trim()).filter(Boolean)
  return items.length ? items : fallback
}

function artistCategory(value: unknown): ArtistProfile['category'] {
  const category = String(value ?? '')
  return ['dj', 'mc', 'rapper', 'dancer', 'photographer', 'model', 'designer'].includes(category) ? category as ArtistProfile['category'] : 'dj'
}

function artistGender(value: string): ArtistProfile['gender'] {
  return /^(male|nam)$/i.test(value) ? 'male' : 'female'
}

function mediaUrl(artistId: string | number, field: 'portraitUpload' | 'coverUpload', value: string) {
  return value.startsWith('artist-drafts/') ? `/api/public/artists/${encodeURIComponent(String(artistId))}/media/${field}` : value || defaultImage
}

function mapArtist(document: ArtistDocument): { artist: ArtistProfile; richContent: ArtistRichContent } {
  const draft = document.profileDraft && typeof document.profileDraft === 'object' && !Array.isArray(document.profileDraft) ? document.profileDraft as ArtistProfileDraft : {}
  const id = String(document.id)
  const stageName = String(document.stageName || 'Nghệ sĩ 9LIFE')
  const city = draftValue(draft, 'city') || String(document.serviceArea || 'Đang cập nhật')
  const genres = draftValue(draft, 'genres') || (Array.isArray(document.genres) ? document.genres.map((item) => typeof item === 'object' && item ? String((item as Record<string, unknown>).value ?? '') : String(item)).filter(Boolean).join(', ') : '') || 'Đang cập nhật'
  const portrait = draftValue(draft, 'portraitUpload')
  const cover = draftValue(draft, 'coverUpload')
  const role = draftValue(draft, 'primaryRole') || String(document.role || 'Nghệ sĩ')
  const bio = draftValue(draft, 'shortBio') || String(document.seoDescription || 'Nghệ sĩ đang cập nhật phần giới thiệu.')
  const musicUrl = draftValue(draft, 'sourceUrl')
  const videoUrl = draftValue(draft, 'videoUrl')
  const musicEmbed = getMediaEmbed(musicUrl)
  const videoEmbed = getMediaEmbed(videoUrl)
  const artist: ArtistProfile = {
    id: Number(document.id) || 0, slug: String(document.slug), name: stageName, category: artistCategory(document.role), gender: artistGender(draftValue(draft, 'gender')), role, genres, location: city,
    availability: draftValue(draft, 'availability') || (document.isAvailable === false ? 'Tạm thời chưa nhận show' : 'Đang nhận booking'),
    rate: draftValue(draft, 'bookingRate') || String(document.bookingPriceLabel || 'Liên hệ để biết thêm chi tiết'), followers: 'Mới tham gia',
    image: mediaUrl(id, 'portraitUpload', portrait), cover: mediaUrl(id, 'coverUpload', cover), bio,
    highlights: lines(draftValue(draft, 'signatureMoments'), ['Đang cập nhật điểm mạnh sân khấu.']), performanceModes: lines(draftValue(draft, 'signatureMoments'), [role]), cities: lines(draftValue(draft, 'bookingCities'), [city]),
    socialProof: { monthlyReach: 'Đang cập nhật', eventsDone: 'Đang cập nhật', brandTone: genres },
  }
  return {
    artist,
    richContent: {
      introduction: lines(draftValue(draft, 'longBio'), [bio]), workExperience: lines(draftValue(draft, 'workExperience'), ['Nghệ sĩ đang cập nhật kinh nghiệm làm việc.']), signatureMoments: artist.highlights,
      gallery: [artist.cover, artist.image].filter((image) => image !== defaultImage).map((image, index) => ({ image, caption: index === 0 ? `${stageName} cover` : `${stageName} portrait` })),
      videos: videoEmbed ? [{ title: draftValue(draft, 'videoTitle') || 'Video nổi bật', platform: videoEmbed.provider === 'facebook' ? 'Facebook' : 'YouTube', embedUrl: videoEmbed.src, href: videoUrl }] : [],
      audio: musicEmbed ? [{ title: draftValue(draft, 'trackTitle') || draftValue(draft, 'playlistName') || 'Nhạc nổi bật', subtitle: 'Nội dung do nghệ sĩ cập nhật', embedUrl: musicEmbed.src }] : [],
      socials: [], bookingNotes: lines(draftValue(draft, 'bookingNotes'), ['Nghệ sĩ đang cập nhật ghi chú booking.']), rider: lines(draftValue(draft, 'basicRider'), ['Nghệ sĩ đang cập nhật rider cơ bản.']), faq: [],
    },
  }
}

export async function listPublishedArtists() {
  const payload = await loadPayloadClient()
  const result = await payload.find({ collection: 'artists', where: { profileStatus: { equals: 'published' } }, depth: 0, limit: 200, sort: '-updatedAt', overrideAccess: true })
  return result.docs.map((document) => mapArtist(document as ArtistDocument))
}

export async function getPublishedArtistProfileBySlug(slug: string) {
  const payload = await loadPayloadClient()
  const result = await payload.find({ collection: 'artists', where: { and: [{ slug: { equals: slug } }, { profileStatus: { equals: 'published' } }] }, depth: 0, limit: 1, overrideAccess: true })
  return result.docs[0] ? mapArtist(result.docs[0] as ArtistDocument) : null
}

export async function getPublishedArtistDraftMedia(artistId: string, field: 'portraitUpload' | 'coverUpload') {
  const payload = await loadPayloadClient()
  const artist = await payload.findByID({ collection: 'artists', id: artistId, depth: 0, overrideAccess: true }) as ArtistDocument
  if (artist.profileStatus !== 'published') return null
  const draft = artist.profileDraft && typeof artist.profileDraft === 'object' && !Array.isArray(artist.profileDraft) ? artist.profileDraft as ArtistProfileDraft : {}
  const key = draftValue(draft, field)
  return key.startsWith('artist-drafts/') ? key : null
}
