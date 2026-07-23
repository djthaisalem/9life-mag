import 'server-only'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken, type CmsSession } from '@/lib/cms-session'
import { hasCmsScope, type CmsScope } from '@/lib/cms-role-policy'

export type { CmsScope } from '@/lib/cms-role-policy'

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
  const cookieStore = await cookies()
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value
  const session = await verifyCmsSessionToken(token)

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
