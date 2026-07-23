import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requestPasswordReset } from '@/lib/password-reset'

const forgotPasswordSchema = z.object({
  identity: z.string().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  accountType: z.enum(['user', 'artist']),
})

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = forgotPasswordSchema.parse(body)
    return json(await requestPasswordReset(payload))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { ok: false, message: error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ' },
        400,
      )
    }

    return json(
      { ok: false, message: 'Không thể tạo yêu cầu quên mật khẩu lúc này.' },
      500,
    )
  }
}
