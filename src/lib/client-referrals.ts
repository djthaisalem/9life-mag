import { normalizeSharePath } from '@/lib/url-slug'

export type ReferralSummary = { issuedToday: number; remaining: number; rewarded: number; pending: number; recent: Array<{ id: string; path: string; status: 'pending' | 'visited' | 'rewarded' | 'rejected'; createdAt: string; rewardedAt?: string }> }
export type ReferralResponse = { ok: boolean; message?: string; referral?: { token: string }; remaining?: number; summary?: ReferralSummary; url?: string }

async function readReferral(response: Response) { return (await response.json()) as ReferralResponse }

export async function createReferralShareUrl(path: string) {
  const normalizedPath = normalizeSharePath(path)
  const response = await fetch('/api/referrals', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'share', path: normalizedPath }) })
  const result = await readReferral(response)
  if (!result.ok || !result.referral) return result
  const url = new URL(normalizedPath, window.location.origin)
  url.searchParams.set('ref', result.referral.token)
  return { ...result, url: url.toString() }
}

export async function getReferralSummary() {
  const response = await fetch('/api/referrals', { credentials: 'same-origin', cache: 'no-store' })
  return readReferral(response)
}
