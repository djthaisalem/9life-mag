import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getTrustedClientIp, guardCmsLoginAttempts } from '@/lib/request-guard'
import { env } from '@/lib/env'
import { validatePayloadCmsCredentials } from '@/lib/cms-session-payload'
import {
  CMS_SESSION_COOKIE,
  createCmsSessionToken,
  getCmsSessionCookieOptions,
  validateCmsCredentials,
} from '@/lib/cms-session'

const loginSchema = z.object({
  email: z.string().email('Email quản trị chưa hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  otpCode: z.string().optional().default(''),
  next: z.string().optional().default('/cms/dashboard'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = loginSchema.parse(body)
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardCmsLoginAttempts(payload.email, ip)

    if (!guard.ok) {
      return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
    }

    const result = env.SITE_USER_STORAGE_DRIVER === 'payload'
      ? await validatePayloadCmsCredentials(payload)
      : await validateCmsCredentials(payload)

    if (!result.ok) {
      const message =
        result.reason === 'missing_config'
          ? 'CMS chưa có cấu hình đăng nhập an toàn trong biến môi trường.'
          : result.reason === 'invalid_otp'
            ? 'Mã xác minh chưa đúng.'
            : 'Email hoặc mật khẩu chưa đúng.'

      return NextResponse.json({ ok: false, message }, { status: 401 })
    }

    const token = await createCmsSessionToken({
      email: payload.email,
      role: result.role,
    })

    const response = NextResponse.json({
      ok: true,
      message: 'Đăng nhập CMS thành công.',
      redirectTo: payload.next.startsWith('/cms/dashboard') ? payload.next : '/cms/dashboard',
    })

    response.cookies.set(CMS_SESSION_COOKIE, token, getCmsSessionCookieOptions())
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu đăng nhập chưa hợp lệ.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể đăng nhập CMS lúc này.',
      },
      { status: 500 }
    )
  }
}
