import 'server-only'

import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken, type CmsSession } from '@/lib/cms-session'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { hasCmsScope, type CmsScope } from '@/lib/cms-role-policy'

export type { CmsScope } from '@/lib/cms-role-policy'

export async function hasTrustedCmsRequestOrigin() {
  const headerStore = await headers()
  const origin = headerStore.get('origin')
  if (!origin) return true

  const host = headerStore.get('host')?.trim()
  if (!host) return false

  const forwardedProtocol = process.env.TRUST_PROXY_HEADERS === 'true'
    ? headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim()
    : undefined
  const protocol = forwardedProtocol || 'https'

  try {
    return new URL(origin).origin === `${protocol}://${host}`
  } catch {
    return false
  }
}

export async function requireCmsApiAccess(scope: CmsScope): Promise<
  | {
      ok: true
      session: CmsSession
    }
  | {
      ok: false
      response: NextResponse
    }
> {
  if (!await hasTrustedCmsRequestOrigin()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: 'Origin không hợp lệ cho thao tác nhạy cảm.',
        },
        { status: 403 },
      ),
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value
  const session = await verifyCmsSessionToken(token)

  const headerStore = await headers()
  const authorization = headerStore.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    scope,
  )

  if (capability) {
    return {
      ok: true,
      session: {
        email: capability.email,
        role: capability.role,
        issuedAt: 0,
        expiresAt: capability.expiresAt,
      },
    }
  }

  if (!session) {
    console.warn('CMS API session rejected', {
      reason: token ? 'invalid_or_expired' : 'missing_cookie',
      scope,
    })
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: 'Bạn cần đăng nhập CMS hợp lệ để dùng thao tác này.',
        },
        { status: 401 },
      ),
    }
  }

  if (!hasCmsScope(session.role, scope)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: 'Tài khoản CMS của bạn chưa được cấp quyền cho thao tác này.',
        },
        { status: 403 },
      ),
    }
  }

  return {
    ok: true,
    session,
  }
}
