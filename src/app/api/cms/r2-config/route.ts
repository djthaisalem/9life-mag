import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { saveR2Config } from '@/lib/r2-config'

const r2ConfigSchema = z.object({
  accountId: z.string().min(1, 'Vui lòng nhập Account ID'),
  accessKeyId: z.string().optional().default(''),
  secretAccessKey: z.string().optional().default(''),
  bucket: z.string().min(1, 'Vui lòng nhập tên bucket'),
  endpoint: z.string().optional().default(''),
  publicBaseUrl: z.string().optional().default(''),
})

export async function POST(request: Request) {
  try {
    const access = await requireCmsApiAccess('api_security')
    if (!access.ok) {
      return access.response
    }

    const body = await request.json()
    const payload = r2ConfigSchema.parse(body)

    const snapshot = await saveR2Config(payload)

    return NextResponse.json({
      ok: true,
      message: 'Đã lưu cấu hình Cloudflare R2 vào .env.local. Nếu cần, hãy khởi động lại dev server để toàn bộ dịch vụ nhận cấu hình mới.',
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
        message: 'Không thể lưu cấu hình R2 lúc này.',
      },
      { status: 500 }
    )
  }
}
