import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'

function isSafeOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'

  const host = request.headers.get('host')?.trim()
  if (!host) return false

  const forwardedProtocol = process.env.TRUST_PROXY_HEADERS === 'true'
    ? request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    : undefined
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(':', '')

  try {
    // In standalone mode, nextUrl can retain the bind host (0.0.0.0).
    // Compare against the request Host instead, which is the browser origin.
    return new URL(origin).origin === `${protocol}://${host}`
  } catch {
    return false
  }
}

function buildUnauthorizedApiResponse() {
  const response = NextResponse.json(
    {
      ok: false,
      message: 'Bạn cần đăng nhập CMS hợp lệ để dùng endpoint này.',
    },
    { status: 401 }
  )

  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isCmsApi = pathname.startsWith('/api/cms/')
  const isAuthApi = pathname.startsWith('/api/auth/')
  const isCmsLoginRoute = pathname === '/api/cms/session/login'
  const isCmsLogoutRoute = pathname === '/api/cms/session/logout'
  const isPublicTopupRoute = pathname === '/api/cms/star-topups'
  const isContactRequestRoute = pathname === '/api/contact-requests'
  const isPortalApi = pathname.startsWith('/api/portal/')
  const isReferralRoute = pathname === '/api/referrals'
  const isMediaRoute = pathname.startsWith('/api/media/')
  const isStudentApplicationsRoute = pathname === '/api/student-applications'

  if (pathname.startsWith('/cms/dashboard')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-cms-pathname', pathname)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return response
  }

  if ((isCmsApi || isAuthApi || isContactRequestRoute || isPortalApi || isReferralRoute || isMediaRoute || isStudentApplicationsRoute) && request.method !== 'GET' && request.method !== 'HEAD' && !isSafeOrigin(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Origin không hợp lệ cho thao tác nhạy cảm.',
      },
      { status: 403 }
    )
  }

  if (isCmsLoginRoute) {
    return NextResponse.next()
  }

  const cmsSession = await verifyCmsSessionToken(request.cookies.get(CMS_SESSION_COOKIE)?.value)

  if (isCmsApi || isCmsLogoutRoute) {
    if (isPublicTopupRoute) {
      return NextResponse.next()
    }

    if (!cmsSession) {
      return buildUnauthorizedApiResponse()
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cms/dashboard/:path*', '/api/cms/:path*', '/api/auth/:path*', '/api/contact-requests', '/api/referrals', '/api/portal/:path*', '/api/media/:path*', '/api/student-applications'],
}
