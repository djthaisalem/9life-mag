import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { getTrustedClientIp, guardLoginAttempts } from '@/lib/request-guard'
import {
  getSiteSessionCookieOptions,
  registerSiteAccount,
  SITE_SESSION_COOKIE,
} from '@/lib/site-user-session'

const registerSchema = z
  .object({
    fullName: z.string().trim().optional().default(''),
    email: z.union([z.literal(''), z.string().trim().email('Email chưa hợp lệ')]).optional().default(''),
    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),
    phone: z.string().trim().optional().default(''),
    accountType: z.enum(['user', 'artist']).default('user'),
    portalRole: z.enum(['artist', 'manager', 'booking']).optional(),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.phone) {
      context.addIssue({
        code: 'custom',
        message: 'Vui lòng nhập email hoặc số điện thoại',
        path: ['email'],
      })
    }

    if (value.accountType === 'artist' && (!value.email || value.fullName.length < 2)) {
      context.addIssue({
        code: 'custom',
        message: 'Tài khoản nghệ sĩ cần tên hiển thị và email hợp lệ',
        path: ['fullName'],
      })
    }
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
    const guard = await guardLoginAttempts(payload.email || payload.phone, ip)

    if (!guard.ok) {
      return json({ ok: false, message: guard.message }, 429)
    }

    const result = await registerSiteAccount(payload)

    if (!result.ok) {
      return json(
        {
          ok: false,
          message:
            result.reason === 'duplicate_identity'
              ? 'Email hoặc số điện thoại này đã được đăng ký. Bạn có thể đăng nhập hoặc dùng chức năng quên mật khẩu.'
              : 'Không thể tạo tài khoản lúc này.',
        },
        result.reason === 'duplicate_identity' ? 409 : 400
      )
    }

    try {
      await createPortalNotifications([
        {
          recipientKey: 'admin',
          title: 'Tài khoản mới đăng ký',
          body: `${result.account.fullName} vừa tạo tài khoản ${result.account.accountType === 'artist' ? 'nghệ sĩ' : 'user'}${result.account.email ? ` bằng ${result.account.email}` : ''}.`,
          href: `/cms/dashboard/users/${result.account.id}`,
        },
      ])
    } catch (notificationError) {
      console.error('Could not create CMS signup notification', notificationError)
    }

    const response = json({
      ok: true,
      message:
        result.account.portalAccessStatus === 'pending'
          ? 'Tài khoản đã được tạo và đang chờ quản trị viên duyệt quyền truy cập.'
          : 'Tài khoản đã được tạo, tự động duyệt và đăng nhập thành công.',
      accountType: result.account.accountType,
      portalRole: result.account.portalRole,
      portalAccessStatus: result.account.portalAccessStatus,
    })
    response.cookies.set(SITE_SESSION_COOKIE, result.token, getSiteSessionCookieOptions())
    return response
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

    return json({ ok: false, message: 'Không thể tạo tài khoản lúc này.' }, 500)
  }
}
