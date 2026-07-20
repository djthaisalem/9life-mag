import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { saveAuthConfig } from '@/lib/auth-config'

const authConfigSchema = z.object({
  googleClientId: z.string().optional().default(''),
  googleClientSecret: z.string().optional().default(''),
  facebookAppId: z.string().optional().default(''),
  facebookAppSecret: z.string().optional().default(''),
  resendApiKey: z.string().optional().default(''),
  resetPasswordFromEmail: z.string().optional().default(''),
  resetPasswordFromName: z.string().optional().default(''),
})

export async function POST(request: Request) {
  try {
    const access = await requireCmsApiAccess('api_security')
    if (!access.ok) {
      return access.response
    }

    const body = await request.json()
    const payload = authConfigSchema.parse(body)

    const snapshot = await saveAuthConfig(payload)

    return NextResponse.json({
      ok: true,
      message:
        'Đã lưu cấu hình Google, Facebook và quên mật khẩu vào .env.local. Nếu cần, hãy khởi động lại dev server để các callback và mail reset nhận cấu hình mới.',
      snapshot,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ',
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'runtime_configuration_write_disabled') {
      return NextResponse.json({ ok: false, message: 'Production chỉ nhận secret từ biến môi trường hoặc secret manager của VPS.' }, { status: 409 })
    }

    if (error instanceof Error && error.message.startsWith('unsafe_configuration_value:')) {
      return NextResponse.json({ ok: false, message: 'Giá trị cấu hình chứa ký tự không an toàn.' }, { status: 400 })
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể lưu cấu hình đăng nhập lúc này.',
      },
      { status: 500 }
    )
  }
}
