import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isTrustedRequestOrigin } from '@/lib/request-origin'

function isSafeOrigin(request: NextRequest) {
  return isTrustedRequestOrigin(request.headers, request.nextUrl.protocol.replace(':', ''))
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
  const isUserPlaylistRoute = pathname.startsWith('/api/user-playlists/')
  const isMusicIssueReportRoute = pathname === '/api/music/report-issue'
  const isContentVoteRoute = pathname === '/api/content-votes'

  if (pathname.startsWith('/cms/dashboard')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-cms-pathname', pathname)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    return response
  }

  if ((isCmsApi || pathname.startsWith('/cms/api/') || isAuthApi || isContactRequestRoute || isBookingRequestRoute || isPortalApi || isReferralRoute || isMediaRoute || isStudentApplicationsRoute || isUserPlaylistRoute || isMusicIssueReportRoute || isContentVoteRoute) && request.method !== 'GET' && request.method !== 'HEAD' && !isSafeOrigin(request)) {
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
  matcher: ['/cms/dashboard/:path*', '/cms/api/:path*', '/api/cms/:path*', '/api/auth/:path*', '/api/contact-requests', '/api/booking-requests', '/api/referrals', '/api/portal/:path*', '/api/media/:path*', '/api/music/report-issue', '/api/student-applications', '/api/user-playlists/:path*', '/api/content-votes'],
}
