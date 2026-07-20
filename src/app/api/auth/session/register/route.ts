import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getTrustedClientIp, guardLoginAttempts } from '@/lib/request-guard'
import {
  getSiteSessionCookieOptions,
  registerSiteAccount,
  SITE_SESSION_COOKIE,
} from '@/lib/site-user-session'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập tên hiển thị'),
  email: z.string().email('Email chưa hợp lệ'),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),
  phone: z.string().optional(),
  accountType: z.enum(['user', 'artist']).default('user'),
  portalRole: z.enum(['artist', 'manager', 'booking']).optional(),
})

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = registerSchema.parse(body)
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardLoginAttempts(payload.email, ip)

    if (!guard.ok) {
      return json(
        {
          ok: false,
          message: guard.message,
        },
        429
      )
    }

    const result = await registerSiteAccount(payload)

    if (!result.ok) {
      return json(
        {
          ok: false,
          message:
            result.reason === 'duplicate_identity'
              ? 'Email này đã tồn tại. Bạn có thể đăng nhập hoặc dùng quên mật khẩu.'
              : 'Không thể tạo tài khoản lúc này.',
        },
        result.reason === 'duplicate_identity' ? 409 : 400
      )
    }

    const cookieStore = await cookies()
    cookieStore.set(SITE_SESSION_COOKIE, result.token, getSiteSessionCookieOptions())

    return json({
      ok: true,
      message: result.account.portalAccessStatus === 'pending'
        ? 'Tài khoản đã được tạo và đang chờ quản trị viên duyệt quyền truy cập.'
        : 'Tài khoản đã được tạo và đăng nhập thành công.',
      accountType: result.account.accountType,
      portalRole: result.account.portalRole,
      portalAccessStatus: result.account.portalAccessStatus,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu đăng ký chưa hợp lệ.',
        },
        400
      )
    }

    return json(
      {
        ok: false,
        message: 'Không thể tạo tài khoản lúc này.',
      },
      500
    )
  }
}
