import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { completePasswordReset } from '@/lib/password-reset'
import { getTrustedClientIp, guardResetPasswordAttempts } from '@/lib/request-guard'

const resetPasswordSchema = z
  .object({
    token: z.string().optional().default(''),
    identity: z.string().optional().default(''),
    accountType: z.enum(['user', 'artist']).optional(),
    otp: z.string().optional().default(''),
    password: z.string().min(8, 'Mật khẩu mới cần ít nhất 8 ký tự'),
    confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .superRefine((value, context) => {
    if (!value.token && !(value.identity && value.accountType && value.otp)) {
      context.addIssue({
        code: 'custom',
        message: 'Vui lòng nhập email/số điện thoại và OTP, hoặc mở đúng link khôi phục',
        path: ['otp'],
      })
    }
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: 'custom',
        message: 'Mật khẩu xác nhận chưa khớp',
        path: ['confirmPassword'],
      })
    }
  })

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  try {
    const payload = resetPasswordSchema.parse(await request.json())
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guardKey = payload.token || `${payload.identity}:${payload.otp}`
    const guard = await guardResetPasswordAttempts(guardKey, ip)

    if (!guard.ok) {
      return json({ ok: false, message: guard.message }, 429)
    }

    const result = await completePasswordReset({
      token: payload.token || undefined,
      identity: payload.identity || undefined,
      accountType: payload.accountType,
      otp: payload.otp || undefined,
      password: payload.password,
    })

    return json(result, result.ok ? 200 : 400)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { ok: false, message: error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' },
        400
      )
    }

    return json({ ok: false, message: 'Không thể đặt lại mật khẩu lúc này.' }, 500)
  }
}
