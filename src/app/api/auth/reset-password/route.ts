import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { completePasswordReset } from '@/lib/password-reset'
import { getTrustedClientIp, guardResetPasswordAttempts } from '@/lib/request-guard'

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Thiếu mã đặt lại mật khẩu'),
    password: z.string().min(8, 'Mật khẩu mới cần ít nhất 8 ký tự'),
    confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Mật khẩu xác nhận chưa khớp',
    path: ['confirmPassword'],
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
    const payload = resetPasswordSchema.parse(body)
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardResetPasswordAttempts(payload.token, ip)

    if (!guard.ok) {
      return json(
        {
          ok: false,
          message: guard.message,
        },
        429
      )
    }

    const result = await completePasswordReset({
      token: payload.token,
      password: payload.password,
    })

    return json(result, result.ok ? 200 : 400)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ',
        },
        400
      )
    }

    return json(
      {
        ok: false,
        message: 'Không thể đặt lại mật khẩu lúc này.',
      },
      500
    )
  }
}
