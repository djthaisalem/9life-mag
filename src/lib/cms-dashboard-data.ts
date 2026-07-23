import { artistProfiles } from '@/lib/artist-directory-data'
import { getArtistAgentName, INDEPENDENT_ARTIST_AGENT } from '@/lib/artist-agency-data'
import { clubOutlets } from '@/lib/club-booking-data'
import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'

export const cmsSidebarLinks = [
  { href: '/cms/dashboard', label: 'Tổng quan', key: 'overview' },
  { href: '/cms/dashboard/articles', label: 'Bài viết', key: 'articles' },
  { href: '/cms/dashboard/users', label: 'Quản lý user', key: 'users' },
  { href: '/cms/dashboard/admin-access', label: 'Phân quyền admin', key: 'admin-access' },
  { href: '/cms/dashboard/artists', label: 'Nghệ sĩ', key: 'artists' },
  { href: '/cms/dashboard/music', label: 'Music', key: 'music' },
  { href: '/cms/dashboard/booking', label: 'Booking', key: 'booking' },
  { href: '/cms/dashboard/students', label: 'Học viên', key: 'students' },
  { href: '/cms/dashboard/outlets', label: 'Outlets', key: 'outlets' },
  { href: '/cms/dashboard/stars', label: 'Sao / Thanh toán', key: 'stars' },
  { href: '/cms/dashboard/referrals', label: 'Referral', key: 'referrals' },
  { href: '/cms/dashboard/api', label: 'API / Bảo mật', key: 'api' },
] as const

export const cmsPermissionOptions = [
  'Tổng quan',
  'Bài viết',
  'Quản lý user',
  'Phân quyền admin',
  'Nghệ sĩ',
  'Music',
  'Booking',
  'Outlets',
  'Sao / Thanh toán',
  'Referral',
  'API / Bảo mật',
] as const

const categoryLabels = {
  dj: 'DJ / Producer',
  mc: 'MC Hype',
  rapper: 'Rapper',
  dancer: 'Dancer',
  photographer: 'Photographer',
  model: 'Model',
  designer: 'Designer',
} as const

const genderLabels = {
  female: 'Nữ',
  male: 'Nam',
} as const

export const DEFAULT_ARTIST_AGENT = INDEPENDENT_ARTIST_AGENT

export const cmsArtistRows = repairVietnameseValue(artistProfiles).map((artist, index) => ({
  id: artist.id,
  slug: artist.slug,
  name: artist.name,
  field: categoryLabels[artist.category],
  gender: genderLabels[artist.gender],
  city: artist.location,
  agent: getArtistAgentName(artist.slug),
  rate: artist.rate,
  availability: artist.availability,
  visibility: index < 10 ? 'Đang public' : 'Cần rà soát',
  followers: artist.followers,
  genres: artist.genres,
}))

export const cmsOutletRows = clubOutlets.slice(0, 10).map((outlet, index) => ({
  slug: outlet.slug,
  name: outlet.name,
  city: outlet.city,
  region: outlet.regionLabel,
  vibe: outlet.vibe,
  hours: outlet.hours,
  visibility: index < 6 ? 'ang public' : 'Nh�p n�i b�',
}))

export type CmsMusicGenreRow = {
  id: string
  name: string
  slug: string
  description: string
  showOnMusicPage: boolean
  musicCount: number
}

export const cmsMusicGenreRows: CmsMusicGenreRow[] = [
  {
    id: 'genre-melodic-house',
    name: 'Melodic House',
    slug: 'melodic-house',
    description: 'D�ng ch� l�c cho khung nghe �m v� c�c set build-up gi�u c�m x�c.',
    showOnMusicPage: true,
    musicCount: 12,
  },
  {
    id: 'genre-afro-house',
    name: 'Afro House',
    slug: 'afro-house',
    description: 'D�ng cho c�c nonstop gi�u groove, d� �y dancefloor v� rooftop sunset.',
    showOnMusicPage: true,
    musicCount: 8,
  },
  {
    id: 'genre-club-remix',
    name: 'Club Remix',
    slug: 'club-remix',
    description: 'Nh�m remix �u ti�n cho trang home, top remix v� c�c CTA share / download.',
    showOnMusicPage: true,
    musicCount: 15,
  },
  {
    id: 'genre-underground-techno',
    name: 'Underground Techno',
    slug: 'underground-techno',
    description: 'Kho �m thanh d�nh cho audience th�ch t�i, d�y l�c v� after-hours.',
    showOnMusicPage: false,
    musicCount: 5,
  },
  {
    id: 'genre-community-playlist',
    name: 'Community Playlist',
    slug: 'community-playlist',
    description: 'Playlist do editorial ho�c c�ng �ng curator � tng l��t nghe v� gi� user.',
    showOnMusicPage: true,
    musicCount: 9,
  },
]

export type CmsMusicRow = {
  id: string
  slug: string
  title: string
  type: 'track' | 'nonstop' | 'remix' | 'playlist' | 'album'
  artist: string
  genre: string
  access: string
  visibility: string
  mappedTo: string
  updatedAt: string
  duration: string
  playbackStarCost?: number
  downloadStarCost?: number
}

const cmsMusicSampleRows: CmsMusicRow[] = ([
  {
    id: 'music-010',
    slug: 'water-lily-club-remix-ep',
    title: 'Water Lily Club Remix EP',
    type: 'album',
    artist: 'Luna Flux x Neon Viper',
    genre: 'Club Remix',
    access: 'Public play',
    visibility: 'Đang public',
    mappedTo: 'Music album release / Artist profile',
    updatedAt: '2026-07-16T10:00:00',
      duration: '5 tracks',
      playbackStarCost: 0,
      downloadStarCost: 0,
  },
  {
    id: 'music-009',
    slug: 'golden-hour-pool-edit',
    title: 'Golden Hour Pool Edit',
    type: 'track',
    artist: 'Luna Flux',
    genre: 'Melodic House',
    access: 'Public play',
    visibility: 'ang public',
    mappedTo: 'Music feature / Artist profile',
    updatedAt: '2026-07-15T11:20:00',
      duration: '04:12',
      playbackStarCost: 0,
      downloadStarCost: 0,
  },
  {
    id: 'music-008',
    slug: 'water-lily-club-remix',
    title: 'Water Lily Club Remix',
    type: 'remix',
    artist: 'Luna Flux x Neon Viper',
    genre: 'Club Remix',
    access: 'Tr� sao m�i play',
    visibility: 'ang public',
    mappedTo: 'Home top remix / Music top remix',
    updatedAt: '2026-07-15T09:40:00',
      duration: '04:45',
      playbackStarCost: 1,
      downloadStarCost: 1,
  },
  {
    id: 'music-007',
    slug: 'after-hours-rework',
    title: 'After Hours Rework',
    type: 'remix',
    artist: 'Ghost Frequency',
    genre: 'Club Remix',
    access: 'Premium unlock',
    visibility: 'ang public',
    mappedTo: 'Music top remix / Premium queue',
    updatedAt: '2026-07-14T21:05:00',
    duration: '04:45',
  },
  {
    id: 'music-006',
    slug: 'district-9-sunrise-nonstop',
    title: 'District 9 Sunrise Nonstop',
    type: 'nonstop',
    artist: '9Life Community Lab',
    genre: 'Afro House',
    access: 'Tr� sao m�i play',
    visibility: 'ang public',
    mappedTo: 'Home nonstop / Music listen now',
    updatedAt: '2026-07-14T17:10:00',
    duration: '58:00',
  },
  {
    id: 'music-005',
    slug: 'saigon-neon-edit',
    title: 'Saigon Neon Edit',
    type: 'remix',
    artist: '9Life Community Lab',
    genre: 'Club Remix',
    access: 'Tr� sao m�i play',
    visibility: 'ang public',
    mappedTo: 'Home top remix / Report queue',
    updatedAt: '2026-07-14T10:15:00',
    duration: '04:45',
  },
  {
    id: 'music-004',
    slug: 'rooftop-rush-vol-2',
    title: 'Rooftop Rush Vol. 2',
    type: 'playlist',
    artist: 'Editorial Desk',
    genre: 'Community Playlist',
    access: 'Public play',
    visibility: 'ang public',
    mappedTo: 'Music d�nh cho b�n / Share playlist',
    updatedAt: '2026-07-13T22:40:00',
    duration: '15 tracks',
  },
  {
    id: 'music-003',
    slug: 'blackout-booth-session',
    title: 'Blackout Booth Session',
    type: 'nonstop',
    artist: 'Ghost Frequency',
    genre: 'Underground Techno',
    access: 'Premium unlock',
    visibility: 'C�n r� so�t',
    mappedTo: 'Music listen now / Exclusive slider',
    updatedAt: '2026-07-13T15:30:00',
    duration: '01:10:00',
  },
  {
    id: 'music-002',
    slug: 'female-dj-spotlight',
    title: 'Female DJ Spotlight',
    type: 'playlist',
    artist: 'Editorial Desk',
    genre: 'Community Playlist',
    access: 'Public play',
    visibility: 'ang public',
    mappedTo: 'Music artist spotlight / Home CTA',
    updatedAt: '2026-07-12T20:45:00',
    duration: '12 tracks',
  },
  {
    id: 'music-001',
    slug: 'midnight-lane-demo',
    title: 'Midnight Lane Demo',
    type: 'track',
    artist: '',
    genre: 'Melodic House',
    access: 'Ch� n�i b�',
    visibility: 'Nh�p n�i b�',
    mappedTo: 'Ch�a map',
    updatedAt: '2026-07-11T09:00:00',
    duration: '03:56',
  },
] satisfies CmsMusicRow[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

export const cmsMusicRows: CmsMusicRow[] = []

export type CmsMusicTabKey = 'all' | 'track' | 'nonstop' | 'remix' | 'playlist' | 'album'

export const cmsMusicTabOptions: Array<{
  key: CmsMusicTabKey
  label: string
}> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'track', label: 'Track' },
  { key: 'nonstop', label: 'Nonstop' },
  { key: 'remix', label: 'Remix' },
  { key: 'playlist', label: 'Playlist' },
  { key: 'album', label: 'Album / EP' },
]

export type CmsUserRow = {
  id: string
  name: string
  email: string
  type: 'User' | 'Artist account' | 'Agent' | 'Admin'
  stars: string
  premium: string
  activity: string
  status: string
  followedArtists: number
  votes: number
  adminRequest: 'Không có' | 'Chờ duyệt' | 'Đã cấp' | 'Từ chối'
  accessScope: string[]
}

export const cmsUserRows: CmsUserRow[] = [
  {
    id: 'minh-anh',
    name: 'Minh Anh',
    email: 'minhanh@9lifemag.com',
    type: 'Admin',
    stars: '146 sao',
    premium: 'Premium active',
    activity: 'Theo dõi 12 nghệ sĩ',
    status: 'Đang hoạt động',
    followedArtists: 12,
    votes: 38,
    adminRequest: 'Đã cấp',
    accessScope: ['Tổng quan', 'Bài viết', 'Nghệ sĩ', 'Music', 'Quản lý user', 'Booking'],
  },
  {
    id: 'duy-khanh',
    name: 'Duy Khánh',
    email: 'duykhanh@9lifemag.com',
    type: 'User',
    stars: '24 sao',
    premium: 'Free',
    activity: '3 playlist, 18 vote',
    status: 'Chờ nạp thêm',
    followedArtists: 5,
    votes: 18,
    adminRequest: 'Không có',
    accessScope: [],
  },
  {
    id: 'luna-flux',
    name: 'Luna Flux',
    email: 'portal.lunaflux@9lifemag.com',
    type: 'Artist account',
    stars: '0 sao',
    premium: 'Artist portal',
    activity: 'Quản lý profile và music',
    status: 'Đã xác minh',
    followedArtists: 0,
    votes: 0,
    adminRequest: 'Chờ duyệt',
    accessScope: ['Nghệ sĩ', 'Music', 'Booking'],
  },
  {
    id: 'thao-vy',
    name: 'Thảo Vy',
    email: 'thaovy@9lifemag.com',
    type: 'User',
    stars: '88 sao',
    premium: 'Free',
    activity: '4 download tuần này',
    status: 'Có bonus chờ nhận',
    followedArtists: 9,
    votes: 24,
    adminRequest: 'Không có',
    accessScope: [],
  },
  {
    id: 'ghost-frequency',
    name: 'Ghost Frequency',
    email: 'portal.ghostfrequency@9lifemag.com',
    type: 'Artist account',
    stars: '0 sao',
    premium: 'Artist portal',
    activity: '2 booking lead mới',
    status: 'Đã xác minh',
    followedArtists: 0,
    votes: 0,
    adminRequest: 'Chờ duyệt',
    accessScope: ['Nghệ sĩ', 'Music', 'Booking', 'Outlets'],
  },
  {
    id: 'hai-nam',
    name: 'Hải Nam',
    email: 'hainam@9lifemag.com',
    type: 'Agent',
    stars: '9 sao',
    premium: 'Premium trial',
    activity: 'Nghe 7 nonstop hôm nay',
    status: 'Cần rà soát payload',
    followedArtists: 3,
    votes: 7,
    adminRequest: 'Từ chối',
    accessScope: ['Nghệ sĩ'],
  },
  {
    id: 'manager-portal-9life',
    name: '9LIFE Manager',
    email: 'manager@9lifemag.com',
    type: 'Agent',
    stars: '0 sao',
    premium: 'Manager portal',
    activity: 'Map Agent và roster nghệ sĩ',
    status: 'Đã xác minh',
    followedArtists: 0,
    votes: 0,
    adminRequest: 'Chờ duyệt',
    accessScope: ['Nghệ sĩ'],
  },
  {
    id: 'booking-portal-9life',
    name: '9LIFE Booking Coordinator',
    email: 'booking@9lifemag.com',
    type: 'Agent',
    stars: '0 sao',
    premium: 'Booking portal',
    activity: 'Map Outlet và điều phối đặt bàn',
    status: 'Đã xác minh',
    followedArtists: 0,
    votes: 0,
    adminRequest: 'Chờ duyệt',
    accessScope: ['Booking', 'Outlets'],
  },
]

export type CmsAdminApprovalRow = {
  id: string
  name: string
  email: string
  role: string
  requestStatus: 'Ch� duy�t' | '� c�p' | 'T� ch�i'
  requestedScope: string[]
  approvedScope: string[]
  approver: string
}

export const cmsAdminApprovalRows: CmsAdminApprovalRow[] = [
  {
    id: 'luna-flux',
    name: 'Luna Flux',
    email: 'portal.lunaflux@9lifemag.com',
    role: 'Artist account',
    requestStatus: 'Ch� duy�t',
    requestedScope: ['Ngh� s)', 'Music', 'Booking'],
    approvedScope: ['Ngh� s)', 'Music'],
    approver: 'Ch�a duy�t',
  },
  {
    id: 'ghost-frequency',
    name: 'Ghost Frequency',
    email: 'portal.ghostfrequency@9lifemag.com',
    role: 'Artist account',
    requestStatus: 'Ch� duy�t',
    requestedScope: ['Ngh� s)', 'Music', 'Booking', 'Outlets'],
    approvedScope: ['Ngh� s)', 'Music', 'Booking'],
    approver: 'Admin ch� x�c nh�n',
  },
  {
    id: 'minh-anh',
    name: 'Minh Anh',
    email: 'minhanh@9lifemag.com',
    role: 'Admin',
    requestStatus: '� c�p',
    requestedScope: ['T�ng quan', 'B�i vi�t', 'Ngh� s)', 'Music', 'Qu�n l� user', 'Booking'],
    approvedScope: ['T�ng quan', 'B�i vi�t', 'Ngh� s)', 'Music', 'Qu�n l� user', 'Booking'],
    approver: 'Super Admin',
  },
  {
    id: 'hai-nam',
    name: 'H�i Nam',
    email: 'hainam@9lifemag.com',
    role: 'Agent',
    requestStatus: 'T� ch�i',
    requestedScope: ['Qu�n l� user', 'API / B�o m�t'],
    approvedScope: ['Ngh� s)'],
    approver: 'Security Admin',
  },
]

export type CmsArtistBookingRow = {
  id: string
  artistSlug: string
  artistName: string
  requester: string
  venue: string
  showDate: string
  budget: string
  soundcheck: string
  status: 'M�i' | 'ang b�o gi�' | 'Ch� ch�t' | '� x�c nh�n'
}

export const cmsArtistBookingRows: CmsArtistBookingRow[] = [
  {
    id: 'bk-art-003',
    artistSlug: 'ghost-frequency',
    artistName: 'Ghost Frequency',
    requester: 'After Dark H�i An / Ph�c',
    venue: 'H�i An',
    showDate: '02/08/2026 23:00',
    budget: 'Li�n h� th�m',
    soundcheck: '18:00 - DJ booth',
    status: 'Ch� ch�t',
  },
  {
    id: 'bk-art-002',
    artistSlug: 'luna-flux',
    artistName: 'Luna Flux',
    requester: 'Skyline H� N�i / Minh T�',
    venue: 'H� N�i',
    showDate: '26/07/2026 21:00',
    budget: '22.000.000 VND',
    soundcheck: '16:30 - main floor',
    status: 'M�i',
  },
  {
    id: 'bk-art-001',
    artistSlug: 'neon-viper',
    artistName: 'Neon Viper',
    requester: 'Velvet Room / Lan Anh',
    venue: 'TP.HCM',
    showDate: '20/07/2026 22:30',
    budget: '30.000.000 VND',
    soundcheck: '17:00 - booth ch�nh',
    status: 'ang b�o gi�',
  },
]

export type CmsOutletBookingRow = {
  id: string
  outletSlug: string
  outletName: string
  customer: string
  city: string
  bookingDate: string
  guests: string
  packageLabel: string
  status: 'M�i' | 'Gi� b�n' | '� c�c' | 'Ho�n t�t'
}

export const cmsOutletBookingRows: CmsOutletBookingRow[] = [
  {
    id: 'bk-out-003',
    outletSlug: 'luxe-district',
    outletName: 'LUXE District',
    customer: 'V�n My',
    city: 'TP.HCM',
    bookingDate: '25/07/2026 22:00',
    guests: '10 kh�ch',
    packageLabel: 'Birthday Premium',
    status: 'M�i',
  },
  {
    id: 'bk-out-002',
    outletSlug: 'halo-rooftop',
    outletName: 'Halo Rooftop',
    customer: 'Trung Hi�u',
    city: '� N�ng',
    bookingDate: '19/07/2026 20:00',
    guests: '6 kh�ch',
    packageLabel: 'Sky Table',
    status: 'Gi� b�n',
  },
  {
    id: 'bk-out-001',
    outletSlug: 'district-9-pulse',
    outletName: 'District 9 Pulse',
    customer: 'Ng�c Tr�m',
    city: 'TP.HCM',
    bookingDate: '18/07/2026 21:30',
    guests: '8 kh�ch',
    packageLabel: 'VIP Booth',
    status: '� c�c',
  },
]

export const cmsTelegramBookingConfig = {
  globalChannel: '@9lifemag_booking_ops',
  tokenDefault: '',
}

export function getCmsUserById(id: string) {
  return cmsUserRows.find((user) => user.id === id)
}

export function getCmsArtistBySlug(slug: string) {
  return cmsArtistRows.find((artist) => artist.slug === slug)
}

export function getCmsAdminApprovalById(id: string) {
  return cmsAdminApprovalRows.find((item) => item.id === id)
}

export function getCmsOutletBySlug(slug: string) {
  return cmsOutletRows.find((outlet) => outlet.slug === slug)
}

export function getCmsMusicBySlug(slug: string) {
  return cmsMusicRows.find((music) => music.slug === slug)
}
