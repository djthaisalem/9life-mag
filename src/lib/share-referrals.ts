import 'server-only'

import { createHash, randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { awardShareStarsToUser } from '@/lib/site-user-session'

const STORE_PATH = path.join(process.cwd(), 'data', 'share-referrals.json')
const DAILY_LIMIT = 10
const QUALIFY_AFTER_MS = 30_000

type ReferralStatus = 'pending' | 'visited' | 'rewarded' | 'rejected'
type Referral = { id: string; ownerId: string; token: string; path: string; status: ReferralStatus; visitorFingerprint?: string; visitedAt?: string; rewardedAt?: string; createdAt: string }

export type CmsReferralSnapshot = {
  total: number
  page: number
  totalPages: number
  counts: Record<ReferralStatus, number>
  rows: Array<Pick<Referral, 'id' | 'ownerId' | 'path' | 'status' | 'createdAt' | 'visitedAt' | 'rewardedAt'>>
}

export type CmsReferralRange = 'all' | 'today' | 'week' | 'custom'

function getBangkokDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function getBangkokWeekStart() {
  const now = new Date()
  const bangkokToday = new Date(`${getBangkokDateKey(now)}T12:00:00Z`)
  bangkokToday.setUTCDate(bangkokToday.getUTCDate() - ((bangkokToday.getUTCDay() + 6) % 7))
  return getBangkokDateKey(bangkokToday)
}

async function readFileStore(): Promise<Referral[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as { rows?: Referral[] }
    return Array.isArray(parsed.rows) ? parsed.rows : []
  } catch { return [] }
}

async function writeFileStore(rows: Referral[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify({ rows }, null, 2), 'utf8')
}

function getTodayKey(value = new Date()) { return value.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) }
function fingerprint(value: string) { return createHash('sha256').update(value).digest('hex') }
function normalize(doc: Record<string, unknown>): Referral {
  return { id: String(doc.id), ownerId: String(doc.ownerId ?? ''), token: String(doc.token ?? ''), path: String(doc.path ?? '/'), status: doc.status === 'visited' || doc.status === 'rewarded' || doc.status === 'rejected' ? doc.status : 'pending', visitorFingerprint: typeof doc.visitorFingerprint === 'string' ? doc.visitorFingerprint : undefined, visitedAt: typeof doc.visitedAt === 'string' ? doc.visitedAt : undefined, rewardedAt: typeof doc.rewardedAt === 'string' ? doc.rewardedAt : undefined, createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString() }
}

function validPath(value: string) { return value.startsWith('/') && !value.startsWith('//') && value.length <= 500 }

function getRestriction(pathname: string) {
  const path = pathname.split('?')[0]
  if (path.startsWith('/music/library/')) return 'Link playlist cá nhân không áp dụng thưởng chia sẻ.'
  return null
}

export async function createShareReferral(ownerId: string, targetPath: string) {
  if (!validPath(targetPath)) return { ok: false as const, message: 'Liên kết chia sẻ chưa hợp lệ.' }
  const restriction = getRestriction(targetPath)
  if (restriction) return { ok: false as const, message: restriction }
  const today = getTodayKey()
  const now = new Date().toISOString()
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'share-referrals', where: { ownerId: { equals: ownerId } }, sort: '-createdAt', limit: 20, depth: 0, pagination: false })
    const issuedToday = (result.docs as Array<Record<string, unknown>>).map(normalize).filter((row) => getTodayKey(new Date(row.createdAt)) === today).length
    const todayRows = (result.docs as Array<Record<string, unknown>>).map(normalize).filter((row) => getTodayKey(new Date(row.createdAt)) === today)
    if (todayRows.some((row) => row.path === targetPath)) return { ok: false as const, message: 'Bạn đã tạo link thưởng cho nội dung này hôm nay. Không thể chia sẻ lại cùng một link để nhận sao.' }
    if (issuedToday >= DAILY_LIMIT) return { ok: false as const, message: 'Bạn đã dùng hết 10 lượt chia sẻ hôm nay. Hạn mức sẽ làm mới vào 12AM.' }
    const token = randomUUID().replace(/-/g, '')
    const doc = await payload.create({ collection: 'share-referrals', data: { ownerId, token, path: targetPath, status: 'pending' } })
    return { ok: true as const, referral: normalize(doc as Record<string, unknown>), remaining: DAILY_LIMIT - issuedToday - 1 }
  }
  const rows = await readFileStore()
  const todayRows = rows.filter((row) => row.ownerId === ownerId && getTodayKey(new Date(row.createdAt)) === today)
  const issuedToday = todayRows.length
  if (todayRows.some((row) => row.path === targetPath)) return { ok: false as const, message: 'Bạn đã tạo link thưởng cho nội dung này hôm nay. Không thể chia sẻ lại cùng một link để nhận sao.' }
  if (issuedToday >= DAILY_LIMIT) return { ok: false as const, message: 'Bạn đã dùng hết 10 lượt chia sẻ hôm nay. Hạn mức sẽ làm mới vào 12AM.' }
  const referral: Referral = { id: `share-${Date.now()}-${randomUUID().slice(0, 8)}`, ownerId, token: randomUUID().replace(/-/g, ''), path: targetPath, status: 'pending', createdAt: now }
  await writeFileStore([referral, ...rows].slice(0, 5000))
  return { ok: true as const, referral, remaining: DAILY_LIMIT - issuedToday - 1 }
}

async function getReferral(token: string) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'share-referrals', where: { token: { equals: token } }, limit: 1, depth: 0, pagination: false })
    const raw = result.docs[0] as Record<string, unknown> | undefined
    return raw ? normalize(raw) : null
  }
  return (await readFileStore()).find((row) => row.token === token) ?? null
}

async function saveReferral(row: Referral) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await payload.update({ collection: 'share-referrals', id: row.id, data: { status: row.status, visitorFingerprint: row.visitorFingerprint, visitedAt: row.visitedAt, rewardedAt: row.rewardedAt } })
    return
  }
  const rows = await readFileStore()
  const index = rows.findIndex((item) => item.id === row.id)
  if (index >= 0) rows[index] = row
  await writeFileStore(rows)
}

export async function registerReferralVisit(token: string, visitorKey: string, visitorAccountId?: string) {
  const row = await getReferral(token)
  if (!row || row.status !== 'pending' || row.ownerId === visitorAccountId) return { ok: false as const }
  const visitorFingerprint = fingerprint(visitorKey)
  if (row.visitorFingerprint && row.visitorFingerprint !== visitorFingerprint) return { ok: false as const }
  row.status = 'visited'
  row.visitorFingerprint = visitorFingerprint
  row.visitedAt ??= new Date().toISOString()
  await saveReferral(row)
  return { ok: true as const }
}

export async function qualifyReferralVisit(token: string, visitorKey: string, visitorAccountId?: string) {
  const row = await getReferral(token)
  if (!row || row.status !== 'visited' || row.ownerId === visitorAccountId || !row.visitedAt || row.visitorFingerprint !== fingerprint(visitorKey)) return { ok: false as const }
  if (Date.now() - new Date(row.visitedAt).getTime() < QUALIFY_AFTER_MS) return { ok: false as const }
  row.status = 'rewarded'
  row.rewardedAt = new Date().toISOString()
  await saveReferral(row)
  const account = await awardShareStarsToUser({ accountId: row.ownerId, reference: `share-${row.id}` })
  return { ok: Boolean(account) as true }
}

export async function getReferralSummary(ownerId: string) {
  const rows = env.SITE_USER_STORAGE_DRIVER === 'payload'
    ? await (async () => { const payload = await loadPayloadClient(); const result = await payload.find({ collection: 'share-referrals', where: { ownerId: { equals: ownerId } }, sort: '-createdAt', limit: 100, depth: 0, pagination: false }); return (result.docs as Array<Record<string, unknown>>).map(normalize) })()
    : (await readFileStore()).filter((row) => row.ownerId === ownerId)
  const today = getTodayKey()
  const ownRows = rows.filter((row) => row.ownerId === ownerId)
  const issuedToday = ownRows.filter((row) => getTodayKey(new Date(row.createdAt)) === today).length
  return {
    issuedToday,
    remaining: Math.max(0, DAILY_LIMIT - issuedToday),
    rewarded: ownRows.filter((row) => row.status === 'rewarded').length,
    pending: ownRows.filter((row) => row.status === 'pending' || row.status === 'visited').length,
    recent: ownRows.slice(0, 10).map((row) => ({ id: row.id, path: row.path, status: row.status, createdAt: row.createdAt, rewardedAt: row.rewardedAt })),
  }
}

export async function getCmsReferralSnapshot(page = 1, limit = 20, filters: { query?: string; range?: CmsReferralRange; from?: string; to?: string } = {}): Promise<CmsReferralSnapshot> {
  const safeLimit = Math.min(Math.max(limit, 1), 50)
  const safePage = Math.max(page, 1)
  const rows = env.SITE_USER_STORAGE_DRIVER === 'payload'
    ? await (async () => {
        const payload = await loadPayloadClient()
        const result = await payload.find({ collection: 'share-referrals', sort: '-createdAt', limit: 5000, depth: 0, pagination: false })
        return (result.docs as Array<Record<string, unknown>>).map(normalize)
      })()
    : await readFileStore()
  const query = filters.query?.trim().toLocaleLowerCase('vi-VN') ?? ''
  const range = filters.range ?? 'all'
  const today = getBangkokDateKey(new Date())
  const weekStart = getBangkokWeekStart()
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(filters.from ?? '') ? filters.from! : ''
  const toDate = /^\d{4}-\d{2}-\d{2}$/.test(filters.to ?? '') ? filters.to! : ''
  const filtered = rows.filter((row) => {
    const createdDate = getBangkokDateKey(new Date(row.createdAt))
    if (range === 'today' && createdDate !== today) return false
    if (range === 'week' && createdDate < weekStart) return false
    if (range === 'custom' && fromDate && createdDate < fromDate) return false
    if (range === 'custom' && toDate && createdDate > toDate) return false
    if (!query) return true
    return `${row.ownerId} ${row.path}`.toLocaleLowerCase('vi-VN').includes(query)
  })
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalPages = Math.max(1, Math.ceil(sorted.length / safeLimit))
  const normalizedPage = Math.min(safePage, totalPages)
  const counts: Record<ReferralStatus, number> = { pending: 0, visited: 0, rewarded: 0, rejected: 0 }
  sorted.forEach((row) => { counts[row.status] += 1 })

  return {
    total: sorted.length,
    page: normalizedPage,
    totalPages,
    counts,
    rows: sorted.slice((normalizedPage - 1) * safeLimit, normalizedPage * safeLimit).map((row) => ({
      id: row.id,
      ownerId: row.ownerId,
      path: row.path,
      status: row.status,
      createdAt: row.createdAt,
      visitedAt: row.visitedAt,
      rewardedAt: row.rewardedAt,
    })),
  }
}
