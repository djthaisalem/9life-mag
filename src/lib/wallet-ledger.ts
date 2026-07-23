import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

export type WalletEventType =
  | 'signup_bonus'
  | 'daily_claim'
  | 'bonus_claim'
  | 'playlist_reward'
  | 'share_reward'
  | 'topup_approved'
  | 'spend_general'
  | 'spend_vote'
  | 'spend_playback'
  | 'spend_download'
  | 'manual_adjustment'

export type WalletLedgerEntry = {
  id: string
  userId: string
  amount: number
  balanceAfter: number
  eventType: WalletEventType
  note?: string
  reference: string
  createdAt: string
}

const STORE_PATH = path.join(process.cwd(), 'data', 'wallet-ledger.json')

async function readFileLedger() {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(content) as { entries?: WalletLedgerEntry[] }
    return Array.isArray(parsed.entries) ? parsed.entries : []
  } catch {
    return []
  }
}

async function writeFileLedger(entries: WalletLedgerEntry[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify({ entries }, null, 2), 'utf8')
}

export async function recordWalletLedgerEntry(input: Omit<WalletLedgerEntry, 'id' | 'createdAt'>) {
  const entry: WalletLedgerEntry = {
    ...input,
    id: `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const numericUserId = Number(entry.userId)
    const userRelation = Number.isSafeInteger(numericUserId) && numericUserId > 0
      ? numericUserId
      : undefined

    await payload.create({
      collection: 'wallet-ledger',
      data: {
        user: userRelation,
        siteUserId: entry.userId,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        eventType: entry.eventType,
        note: entry.note,
        reference: entry.reference,
      },
    })
    return entry
  }

  const entries = await readFileLedger()
  entries.unshift(entry)
  await writeFileLedger(entries.slice(0, 5000))
  return entry
}

export async function getWalletLedgerSnapshot() {
  if (env.SITE_USER_STORAGE_DRIVER !== 'payload') {
    return (await readFileLedger()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: 'wallet-ledger',
    sort: '-createdAt',
    limit: 5000,
    depth: 0,
    pagination: false,
  })

  return (result.docs as Array<Record<string, unknown>>).map<WalletLedgerEntry>((entry) => ({
    id: String(entry.id),
    userId: String(entry.siteUserId ?? entry.user ?? ''),
    amount: typeof entry.amount === 'number' ? entry.amount : 0,
    balanceAfter: typeof entry.balanceAfter === 'number' ? entry.balanceAfter : 0,
    eventType: entry.eventType as WalletEventType,
    note: typeof entry.note === 'string' ? entry.note : undefined,
    reference: typeof entry.reference === 'string' ? entry.reference : '',
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
  }))
}

export async function hasRecentMediaStarCharge(
  userId: string,
  trackId: string,
  eventType: Extract<WalletEventType, 'spend_playback' | 'spend_download'>,
  windowMs: number,
) {
  const minimumCreatedAt = Date.now() - windowMs
  const referencePrefix = `media-access:${eventType}:${userId}:${trackId}:`

  const entries = await getWalletLedgerSnapshot()
  return entries.some((entry) =>
    entry.userId === userId &&
    entry.eventType === eventType &&
    entry.reference.startsWith(referencePrefix) &&
    new Date(entry.createdAt).getTime() >= minimumCreatedAt,
  )
}

export async function getRecentPremiumAccess(userId: string, windowMs = 24 * 60 * 60 * 1000) {
  const minimumCreatedAt = Date.now() - windowMs
  const referencePrefix = `premium-access:${userId}:`
  const entries = await getWalletLedgerSnapshot()
  const entry = entries.find((item) =>
    item.userId === userId &&
    item.eventType === 'spend_general' &&
    item.reference.startsWith(referencePrefix) &&
    new Date(item.createdAt).getTime() >= minimumCreatedAt,
  )

  if (!entry) return null

  return {
    activatedAt: entry.createdAt,
    expiresAt: new Date(new Date(entry.createdAt).getTime() + windowMs).toISOString(),
  }
}
