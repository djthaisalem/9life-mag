import 'server-only'

import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

const STORE_PATH = path.join(process.cwd(), 'data', 'request-guard.json')

type RequestGuardBucket = {
  key: string
  attempts: number[]
}

type RequestGuardStore = {
  buckets: RequestGuardBucket[]
}

type GuardRule = {
  maxAttempts: number
  windowMs: number
  blockMessage: string
}

/**
 * Proxy headers are attacker-controlled unless the origin is reachable only
 * through a configured reverse proxy or Cloudflare.
 */
export function getTrustedClientIp(headers: Headers) {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'untrusted-origin'

  const cloudflareIp = headers.get('cf-connecting-ip')?.trim()
  const reverseProxyIp = headers.get('x-real-ip')?.trim()
  const forwardedIp = headers.get('x-forwarded-for')?.split(',')[0]?.trim()

  return cloudflareIp || reverseProxyIp || forwardedIp || 'unknown'
}

function emptyStore(): RequestGuardStore {
  return {
    buckets: [],
  }
}

async function readStore() {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(content) as RequestGuardStore
    return {
      buckets: Array.isArray(parsed.buckets) ? parsed.buckets : [],
    }
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: RequestGuardStore) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function buildFingerprint(scope: string, parts: string[]) {
  return hashKey([scope, ...parts.map((part) => part.trim().toLowerCase())].join('|'))
}

async function enforceFileRule(scope: string, parts: string[], rule: GuardRule) {
  const store = await readStore()
  const now = Date.now()
  const key = buildFingerprint(scope, parts)
  const bucket = store.buckets.find((item) => item.key === key)
  const attempts = (bucket?.attempts ?? []).filter((timestamp) => now - timestamp < rule.windowMs)

  if (attempts.length >= rule.maxAttempts) {
    if (bucket) {
      bucket.attempts = attempts
      await writeStore(store)
    }

    return {
      ok: false as const,
      message: rule.blockMessage,
    }
  }

  attempts.push(now)

  if (bucket) {
    bucket.attempts = attempts
  } else {
    store.buckets.unshift({ key, attempts })
  }

  store.buckets = store.buckets
    .map((item) => ({
      ...item,
      attempts: item.attempts.filter((timestamp) => now - timestamp < 24 * 60 * 60 * 1000),
    }))
    .filter((item) => item.attempts.length > 0)
    .slice(0, 2000)

  await writeStore(store)

  return {
    ok: true as const,
  }
}

async function enforcePayloadRule(scope: string, parts: string[], rule: GuardRule) {
  const payload = await loadPayloadClient()
  const now = Date.now()
  const key = buildFingerprint(scope, parts)
  const existing = await payload.find({
    collection: 'request-guards',
    where: {
      fingerprint: {
        equals: key,
      },
    },
    limit: 1,
    depth: 0,
    pagination: false,
  })

  const doc = existing.docs[0] as
    | {
        id: string
        attemptTimestamps?: Array<{ value?: string }>
      }
    | undefined

  const attempts = (doc?.attemptTimestamps ?? [])
    .map((item) => (item?.value ? new Date(item.value).getTime() : NaN))
    .filter((timestamp) => Number.isFinite(timestamp) && now - timestamp < rule.windowMs)

  if (attempts.length >= rule.maxAttempts) {
    if (doc?.id) {
      await payload.update({
        collection: 'request-guards',
        id: doc.id,
        data: {
          attemptCount: attempts.length,
          attemptTimestamps: attempts.map((timestamp) => ({
            value: new Date(timestamp).toISOString(),
          })),
        },
      })
    }

    return {
      ok: false as const,
      message: rule.blockMessage,
    }
  }

  attempts.push(now)
  const data = {
    scope,
    fingerprint: key,
    attemptCount: attempts.length,
    attemptTimestamps: attempts.map((timestamp) => ({
      value: new Date(timestamp).toISOString(),
    })),
  }

  if (doc?.id) {
    await payload.update({
      collection: 'request-guards',
      id: doc.id,
      data,
    })
  } else {
    await payload.create({
      collection: 'request-guards',
      data,
    })
  }

  return {
    ok: true as const,
  }
}

async function enforceRule(scope: string, parts: string[], rule: GuardRule) {
  return env.SITE_USER_STORAGE_DRIVER === 'payload'
    ? enforcePayloadRule(scope, parts, rule)
    : enforceFileRule(scope, parts, rule)
}

export async function guardLoginAttempts(identity: string, ip: string) {
  return enforceRule('login', [identity, ip], {
    maxAttempts: 6,
    windowMs: 15 * 60 * 1000,
    blockMessage: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.',
  })
}

export async function guardCmsLoginAttempts(identity: string, ip: string) {
  return enforceRule('cms-login', [identity, ip], {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockMessage: 'Bạn đã thử đăng nhập CMS quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.',
  })
}

export async function guardCmsAccessRequestAttempts(email: string, ip: string) {
  return enforceRule('cms-access-request', [email, ip], {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockMessage: 'Bạn đã gửi quá nhiều yêu cầu cấp quyền. Vui lòng thử lại sau 1 giờ.',
  })
}

export async function guardForgotPasswordAttempts(identity: string, ip: string) {
  return enforceRule('forgot-password', [identity, ip], {
    maxAttempts: 4,
    windowMs: 30 * 60 * 1000,
    blockMessage: 'Bạn đã gửi quá nhiều yêu cầu quên mật khẩu. Vui lòng chờ 30 phút rồi thử lại.',
  })
}

export async function guardResetPasswordAttempts(token: string, ip: string) {
  return enforceRule('reset-password', [token, ip], {
    maxAttempts: 5,
    windowMs: 30 * 60 * 1000,
    blockMessage: 'Bạn đã thử đặt lại mật khẩu quá nhiều lần. Vui lòng chờ 30 phút rồi thử lại.',
  })
}

export async function guardContactRequestAttempts(email: string, ip: string) {
  return enforceRule('contact-request', [email, ip], {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockMessage: 'Bạn đã gửi quá nhiều liên hệ. Vui lòng chờ 1 giờ rồi thử lại.',
  })
}

export async function guardReferralAttempts(identity: string, ip: string, action: 'share' | 'visit') {
  return enforceRule(`referral-${action}`, [identity, ip], {
    maxAttempts: action === 'share' ? 12 : 30,
    windowMs: action === 'share' ? 60 * 60 * 1000 : 15 * 60 * 1000,
    blockMessage: 'Bạn đã thao tác referral quá nhiều lần. Vui lòng thử lại sau.',
  })
}
