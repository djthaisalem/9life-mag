import { getRuntimeSecret } from '@/lib/runtime-security'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

export const CMS_SESSION_COOKIE = 'nine_life_cms_session'
const CMS_SESSION_TTL_SECONDS = 60 * 60 * 8

export type CmsSession = {
  email: string
  role: string
  issuedAt: number
  expiresAt: number
}

type CmsLoginConfig = {
  email: string
  password: string
  otpCode: string
  role: string
}

const CMS_ROLE_MAP: Record<string, string> = {
  admin: 'super_admin',
  super_admin: 'super_admin',
  security_admin: 'security_admin',
  finance: 'finance_ops',
  finance_ops: 'finance_ops',
  booking_ops: 'booking_ops',
  artist_ops: 'artist_ops',
  editor: 'editor',
}

function getSessionSecret() {
  return getRuntimeSecret('CMS_SESSION_SECRET', 'cms-session')
}

function getLoginConfig(): CmsLoginConfig {
  return {
    email: process.env.CMS_ADMIN_EMAIL?.trim().toLowerCase() ?? '',
    password: process.env.CMS_ADMIN_PASSWORD ?? '',
    otpCode: process.env.CMS_ADMIN_OTP_CODE ?? '',
    role: process.env.CMS_ADMIN_ROLE?.trim() || 'super_admin',
  }
}

function toBase64Url(input: string) {
  const encoded = btoa(input)
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return atob(`${normalized}${padding}`)
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  const bytes = Array.from(new Uint8Array(signature))
  const binary = String.fromCharCode(...bytes)
  return toBase64Url(binary)
}

export async function createCmsSessionToken(input: { email: string; role?: string }) {
  const issuedAt = Date.now()
  const payload: CmsSession = {
    email: input.email.trim().toLowerCase(),
    role: input.role?.trim() || 'super_admin',
    issuedAt,
    expiresAt: issuedAt + CMS_SESSION_TTL_SECONDS * 1000,
  }

  const payloadString = JSON.stringify(payload)
  const encodedPayload = toBase64Url(payloadString)
  const signature = await signValue(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function verifyCmsSessionToken(token?: string | null) {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await signValue(encodedPayload)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as CmsSession
    if (!payload.email || !payload.role) return null
    if (payload.expiresAt <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getCmsSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CMS_SESSION_TTL_SECONDS,
  }
}

export async function validateCmsCredentials(input: { email: string; password: string; otpCode?: string }) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()

    try {
      const result = await payload.login({
        collection: 'users',
        data: {
          email: input.email.trim().toLowerCase(),
          password: input.password,
        },
      })
      const user = result.user as { isActive?: boolean; role?: string }
      const role = CMS_ROLE_MAP[user.role ?? '']

      if (!user.isActive || !role) {
        return { ok: false as const, reason: 'invalid_credentials' as const }
      }

      const requiredOtp = process.env.CMS_ADMIN_OTP_CODE?.trim()
      if (requiredOtp && input.otpCode?.trim() !== requiredOtp) {
        return { ok: false as const, reason: 'invalid_otp' as const }
      }

      return { ok: true as const, role }
    } catch {
      return { ok: false as const, reason: 'invalid_credentials' as const }
    }
  }

  const config = getLoginConfig()

  if (!config.email || !config.password) {
    return {
      ok: false as const,
      reason: 'missing_config' as const,
    }
  }

  if (input.email.trim().toLowerCase() !== config.email || input.password !== config.password) {
    return {
      ok: false as const,
      reason: 'invalid_credentials' as const,
    }
  }

  if (config.otpCode && input.otpCode?.trim() !== config.otpCode) {
    return {
      ok: false as const,
      reason: 'invalid_otp' as const,
    }
  }

  return {
    ok: true as const,
    role: config.role,
  }
}
