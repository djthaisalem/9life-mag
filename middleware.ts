import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'
import { getCmsDashboardScope, hasCmsScope } from '@/lib/cms-role-policy'

function isSafeOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'
  return origin === request.nextUrl.origin
}

function buildUnauthorizedApiResponse() {
  return NextResponse.json(
    {
      ok: false,
      message: 'Bạn cần đăng nhập CMS hợp lệ để dùng endpoint này.',
    },
    { status: 401 }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
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

  if (pathname.startsWith('/cms/dashboard')) {
    if (!cmsSession) {
      const loginUrl = new URL('/cms', request.url)
      loginUrl.searchParams.set('next', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }

    if (!hasCmsScope(cmsSession.role, getCmsDashboardScope(pathname))) {
      return NextResponse.rewrite(new URL('/cms/forbidden', request.url), { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cms/dashboard/:path*', '/api/cms/:path*', '/api/auth/:path*', '/api/contact-requests', '/api/referrals', '/api/portal/:path*', '/api/media/:path*', '/api/student-applications'],
}
