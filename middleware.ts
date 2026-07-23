import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isCmsApi = pathname.startsWith('/api/cms/')
  const isAuthApi = pathname.startsWith('/api/auth/')
  const isCmsLoginRoute = pathname === '/api/cms/session/login'
  const isContactRequestRoute = pathname === '/api/contact-requests'
  const isBookingRequestRoute = pathname === '/api/booking-requests'
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

  if ((isCmsApi || isAuthApi || isContactRequestRoute || isBookingRequestRoute || isPortalApi || isReferralRoute || isMediaRoute || isStudentApplicationsRoute) && request.method !== 'GET' && request.method !== 'HEAD' && !isSafeOrigin(request)) {
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

  // CMS API routes validate the session and role in the Node.js route runtime.
  // Avoid verifying the same token again in middleware, which can use a different runtime.
  if (isCmsApi) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cms/dashboard/:path*', '/api/cms/session/:path*', '/api/cms/access-requests', '/api/cms/star-topups', '/api/auth/:path*', '/api/contact-requests', '/api/booking-requests', '/api/referrals', '/api/portal/:path*', '/api/media/:path*', '/api/student-applications'],
}
