import 'server-only'

import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { getRuntimeSecret } from '@/lib/runtime-security'
import { hasCmsScope, type CmsScope } from '@/lib/cms-role-policy'

const CAPABILITY_TTL_MS = 10 * 60 * 1000

type CmsCapability = {
  email: string
  role: string
  scope: CmsScope
  expiresAt: number
  nonce: string
}

function getCapabilitySecret() {
  return getRuntimeSecret('CMS_SESSION_SECRET', 'cms-capability') as string
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getCapabilitySecret()).update(encodedPayload).digest('base64url')
}

export function createCmsCapabilityToken(input: { email: string; role: string; scope: CmsScope }) {
  const payload: CmsCapability = {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    scope: input.scope,
    expiresAt: Date.now() + CAPABILITY_TTL_MS,
    nonce: randomUUID(),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encodedPayload}.${signPayload(encodedPayload)}`
}

export function verifyCmsCapabilityToken(token: string | null | undefined, expectedScope: CmsScope) {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = signPayload(encodedPayload)
  const receivedBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expectedSignature)
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as CmsCapability
    if (!payload.email || !payload.role || payload.scope !== expectedScope) return null
    if (payload.expiresAt <= Date.now() || !hasCmsScope(payload.role, expectedScope)) return null
    return payload
  } catch {
    return null
  }
}
