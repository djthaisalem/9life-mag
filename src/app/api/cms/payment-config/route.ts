import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { savePaymentConfig } from '@/lib/payment-config'

const paymentConfigSchema = z.object({
  bankCode: z.string().default(''),
  bankName: z.string().max(120).default(''),
  accountNumber: z.string().default(''),
  accountName: z.string().default(''),
  qrTemplate: z.string().default('compact2'),
  momoPartnerCode: z.string().default(''),
  momoAccessKey: z.string().default(''),
  momoSecretKey: z.string().default(''),
  momoEndpoint: z.string().default(''),
  viettelMerchantId: z.string().default(''),
  viettelSecretKey: z.string().default(''),
  viettelEndpoint: z.string().default(''),
  paypalClientId: z.string().default(''),
  paypalSecretKey: z.string().default(''),
  paypalBaseUrl: z.string().default(''),
  defaultProviderVN: z.string().default('bank_qr,momo,viettel_money'),
  defaultProviderGlobal: z.string().default('paypal'),
  processingMode: z.enum(['manual', 'sandbox', 'live']).default('manual'),
  telegramBotToken: z.string().default(''),
  telegramChannel: z.string().default(''),
})

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization')
    const capability = verifyCmsCapabilityToken(
      authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
      'stars',
    )
    const access = capability ? { ok: true as const } : await requireCmsApiAccess('stars')
    if (!access.ok) return access.response

    const body = await request.json()
    const payload = paymentConfigSchema.parse(body)
    const snapshot = await savePaymentConfig(payload)

    return NextResponse.json({
      ok: true,
      message: 'Đã lưu cấu hình thanh toán và Telegram vào .env.local.',
      snapshot,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.issues[0]?.message ?? 'Dữ liệu cấu hình chưa hợp lệ.',
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
        message: 'Không thể lưu cấu hình thanh toán lúc này.',
      },
      { status: 500 }
    )
  }
}
