import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import {
  cmsArtistBookingRows,
  cmsOutletBookingRows,
  cmsTelegramBookingConfig,
} from '@/lib/cms-dashboard-data'

export type BookingStatus =
  | 'Mới'
  | 'Đang báo giá'
  | 'Chờ chốt'
  | 'Đã xác nhận'
  | 'Giữ bàn'
  | 'Đã cọc'
  | 'Hoàn tất'
  | 'Huỷ'

export type BookingReminderConfig = {
  telegramChannel: string
  profileChannel: string
  reminderAt: string
  soundcheckAt: string
  checkinAt: string
  followUpAt: string
  assistantNote: string
}

export type BookingReminderDispatch = {
  reminderSentAt?: string
  soundcheckSentAt?: string
  checkinSentAt?: string
  followUpSentAt?: string
}

export type BookingField = {
  label: string
  value: string
}

export type BookingRequestRecord = {
  id: string
  type: 'artist' | 'outlet' | 'contact'
  typeLabel: string
  title: string
  requester: string
  location: string
  schedule: string
  detail: string
  status: BookingStatus
  href: string
  submittedFields: BookingField[]
  internalNotes: string[]
  reminderConfig: BookingReminderConfig
  reminderDispatch: BookingReminderDispatch
}

type BookingStoreShape = {
  requests: BookingRequestRecord[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'cms-booking-requests.json')
const DEMO_BOOKING_IDS = new Set([
  'bk-art-001',
  'bk-art-002',
  'bk-art-003',
  'bk-out-001',
  'bk-out-002',
  'bk-out-003',
])

function getDefaultArtistChannel(slug: string) {
  return `@artist_${slug.replaceAll('-', '_')}_ops`
}

function getDefaultOutletChannel(slug: string) {
  return `@outlet_${slug.replaceAll('-', '_')}_ops`
}

function normalizeStatus(status: string): BookingStatus {
  switch (status) {
    case 'Mới':
    case 'Đang báo giá':
    case 'Chờ chốt':
    case 'Đã xác nhận':
    case 'Giữ bàn':
    case 'Đã cọc':
    case 'Hoàn tất':
    case 'Huỷ':
      return status
    default:
      return 'Mới'
  }
}

function createDefaultStore(): BookingStoreShape {
  const artistRequests: BookingRequestRecord[] = cmsArtistBookingRows.map((item) => ({
    id: item.id,
    type: 'artist',
    typeLabel: 'Booking nghệ sĩ',
    title: item.artistName,
    requester: item.requester,
    location: item.venue,
    schedule: item.showDate,
    detail: `${item.budget} • ${item.soundcheck}`,
    status: normalizeStatus(String(item.status)),
    href: `/cms/dashboard/artists/${item.artistSlug}`,
    submittedFields: [
      { label: 'Tên nghệ sĩ', value: item.artistName },
      { label: 'Đơn vị gửi', value: item.requester },
      { label: 'Venue / thành phố', value: item.venue },
      { label: 'Ngày giờ show', value: item.showDate },
      { label: 'Budget', value: item.budget },
      { label: 'Soundcheck', value: item.soundcheck },
      { label: 'Email / hotline', value: 'booking@9lifemag.com • 0909 000 111' },
      { label: 'Mô tả chương trình', value: 'Cần set headline 60-90 phút, có MC intro và visual opening.' },
    ],
    internalNotes: [
      'Nhắc lại venue xác nhận booth, monitor và đường vào nghệ sĩ.',
      'Nếu chưa chốt giá, bot cần nhắc follow-up sau khi gửi báo giá 2 giờ.',
    ],
    reminderConfig: {
      telegramChannel: cmsTelegramBookingConfig.globalChannel,
      profileChannel: getDefaultArtistChannel(item.artistSlug),
      reminderAt: '',
      soundcheckAt: '',
      checkinAt: '',
      followUpAt: '',
      assistantNote: 'Nhắc đội booking kiểm tra rider, line-up, đón nghệ sĩ và xác nhận thanh toán.',
    },
    reminderDispatch: {},
  }))

  const outletRequests: BookingRequestRecord[] = cmsOutletBookingRows.map((item) => ({
    id: item.id,
    type: 'outlet',
    typeLabel: 'Đặt bàn',
    title: item.outletName,
    requester: item.customer,
    location: item.city,
    schedule: item.bookingDate,
    detail: `${item.guests} • ${item.packageLabel}`,
    status: normalizeStatus(String(item.status)),
    href: `/cms/dashboard/outlets/${item.outletSlug}`,
    submittedFields: [
      { label: 'Outlet', value: item.outletName },
      { label: 'Khách đặt', value: item.customer },
      { label: 'Địa phương', value: item.city },
      { label: 'Ngày giờ booking', value: item.bookingDate },
      { label: 'Số khách', value: item.guests },
      { label: 'Gói bàn', value: item.packageLabel },
      { label: 'Liên hệ khách', value: 'guest@9lifemag.com • 0908 888 222' },
      { label: 'Ghi chú thêm', value: 'Muốn bàn đẹp, vào trước 30 phút và có hỗ trợ check-in nhanh.' },
    ],
    internalNotes: [
      'Nhắc floor manager xác nhận cọc và giữ bàn đúng khung giờ.',
      'Nếu khách có sinh nhật hoặc setup riêng, bot cần nhắc crew trước giờ vào 60 phút.',
    ],
    reminderConfig: {
      telegramChannel: cmsTelegramBookingConfig.globalChannel,
      profileChannel: getDefaultOutletChannel(item.outletSlug),
      reminderAt: '',
      soundcheckAt: '',
      checkinAt: '',
      followUpAt: '',
      assistantNote: 'Nhắc xác nhận cọc, số khách thực tế, bàn giữ và người tiếp đón tại cửa.',
    },
    reminderDispatch: {},
  }))

  return {
    requests: [...artistRequests, ...outletRequests].sort((a, b) => b.schedule.localeCompare(a.schedule)),
  }
}

async function ensureStore(): Promise<BookingStoreShape> {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf8')
    const store = JSON.parse(content) as BookingStoreShape
    const requests = store.requests.filter((request) => !DEMO_BOOKING_IDS.has(request.id))
    if (requests.length !== store.requests.length) {
      const sanitized = { requests }
      await saveStore(sanitized)
      return sanitized
    }
    return store
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const initial: BookingStoreShape = { requests: [] }
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
}

async function saveStore(store: BookingStoreShape) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

export async function getBookingRequestsSnapshot() {
  const store = await ensureStore()
  return [...store.requests].sort((a, b) => b.schedule.localeCompare(a.schedule))
}

export async function createContactRequest(input: {
  topic: string
  fullName: string
  organization: string
  role: string
  email: string
  phone: string
  referenceLink: string
  timeline: string
  message: string
  goodwill: string
}) {
  const store = await ensureStore()
  const submittedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const request: BookingRequestRecord = {
    id: `contact-${Date.now()}`,
    type: 'contact',
    typeLabel: 'Liên hệ',
    title: input.topic,
    requester: input.fullName,
    location: input.organization || 'Cá nhân',
    schedule: submittedAt,
    detail: input.message.slice(0, 140),
    status: 'Mới',
    href: '/lien-he',
    submittedFields: [
      { label: 'Nội dung liên hệ', value: input.topic },
      { label: 'Họ và tên', value: input.fullName },
      { label: 'Đơn vị / thương hiệu / nghệ danh', value: input.organization || 'Chưa cung cấp' },
      { label: 'Vai trò', value: input.role || 'Chưa cung cấp' },
      { label: 'Email', value: input.email },
      { label: 'Số điện thoại / Zalo', value: input.phone || 'Chưa cung cấp' },
      { label: 'Link tham chiếu', value: input.referenceLink || 'Không có' },
      { label: 'Thời hạn mong muốn', value: input.timeline || 'Không có' },
      { label: 'Nội dung chi tiết', value: input.message },
      { label: 'Ghi chú thiện chí', value: input.goodwill || 'Không có' },
    ],
    internalNotes: ['Liên hệ mới từ site chính, cần kiểm tra đầu mối và phản hồi theo nhóm nội dung đã chọn.'],
    reminderConfig: {
      telegramChannel: cmsTelegramBookingConfig.globalChannel,
      profileChannel: '',
      reminderAt: '',
      soundcheckAt: '',
      checkinAt: '',
      followUpAt: '',
      assistantNote: 'Nhắc đội vận hành phản hồi yêu cầu liên hệ mới.',
    },
    reminderDispatch: {},
  }

  store.requests.push(request)
  await saveStore(store)
  return request
}

export async function createPublicBookingRequest(input: {
  type: 'artist' | 'outlet'
  title: string
  requester: string
  location: string
  schedule: string
  detail: string
  href: string
  submittedFields: BookingField[]
}) {
  const store = await ensureStore()
  const request: BookingRequestRecord = {
    id: `${input.type}-${Date.now()}`,
    type: input.type,
    typeLabel: input.type === 'artist' ? 'Booking nghệ sĩ' : 'Đặt bàn',
    title: input.title,
    requester: input.requester,
    location: input.location,
    schedule: input.schedule || new Date().toISOString().slice(0, 10),
    detail: input.detail,
    status: 'Mới',
    href: input.href,
    submittedFields: input.submittedFields,
    internalNotes: ['Yêu cầu mới từ form ngoài site, cần kiểm tra thông tin liên hệ và phản hồi sớm.'],
    reminderConfig: {
      telegramChannel: cmsTelegramBookingConfig.globalChannel,
      profileChannel: '',
      reminderAt: '',
      soundcheckAt: '',
      checkinAt: '',
      followUpAt: '',
      assistantNote:
        input.type === 'artist'
          ? 'Nhắc đội booking kiểm tra lịch nghệ sĩ, ngân sách, rider và thời gian soundcheck.'
          : 'Nhắc outlet xác nhận tình trạng bàn, số khách, ngân sách và đầu mối check-in.',
    },
    reminderDispatch: {},
  }

  store.requests.push(request)
  await saveStore(store)
  return request
}

export async function updateBookingStatus(input: {
  requestId: string
  status: BookingStatus
}) {
  const store = await ensureStore()
  const request = store.requests.find((item) => item.id === input.requestId)

  if (!request) {
    throw new Error('booking-request-not-found')
  }

  request.status = input.status
  await saveStore(store)
  return getBookingRequestsSnapshot()
}

export async function updateBookingReminderConfig(input: {
  requestId: string
  reminderConfig: BookingReminderConfig
}) {
  const store = await ensureStore()
  const request = store.requests.find((item) => item.id === input.requestId)

  if (!request) {
    throw new Error('booking-request-not-found')
  }

  request.reminderConfig = {
    ...input.reminderConfig,
    telegramChannel: input.reminderConfig.telegramChannel.trim(),
    profileChannel: input.reminderConfig.profileChannel.trim(),
  }
  request.reminderDispatch = {}
  await saveStore(store)
  return getBookingRequestsSnapshot()
}

export async function markBookingReminderSent(input: {
  requestId: string
  key: keyof BookingReminderDispatch
  timestamp: string
}) {
  const store = await ensureStore()
  const request = store.requests.find((item) => item.id === input.requestId)

  if (!request) {
    throw new Error('booking-request-not-found')
  }

  request.reminderDispatch[input.key] = input.timestamp
  await saveStore(store)
  return request
}
