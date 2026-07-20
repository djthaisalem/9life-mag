import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { createStarTopupRequest, reviewStarTopupRequest } from '@/lib/star-topups'
import { getAuthenticatedSiteSession, SITE_SESSION_COOKIE } from '@/lib/site-user-session'

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    packageId: z.string().min(1),
    provider: z.enum(['bank_qr', 'momo', 'viettel_money', 'paypal']),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal('review'),
    requestId: z.string().min(1),
    decision: z.enum(['approved', 'rejected']),
    note: z.string().optional(),
  }),
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = requestSchema.parse(body)

    if (payload.action === 'review') {
      const access = await requireCmsApiAccess('stars')
      if (!access.ok) {
        return access.response
      }
    }

    const snapshot =
      payload.action === 'create'
        ? await (async () => {
            const cookieStore = await cookies()
            const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_SESSION_COOKIE)?.value)

            if (!authenticated) {
              throw new Error('site-auth-required')
            }

            return createStarTopupRequest({
              userId: authenticated.session.userId,
              packageId: payload.packageId,
              provider: payload.provider,
              note: payload.note,
            })
          })()
        : await reviewStarTopupRequest(payload)

    return NextResponse.json({
      ok: true,
      snapshot,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'site-auth-required') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Bạn cần đăng nhập user trước khi tạo yêu cầu nạp sao.',
        },
        { status: 401 },
      )
    }

    if (error instanceof Error && error.message === 'bank-qr-config-missing') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Bank QR chưa được cấu hình đủ trong CMS. Cần đủ bank code, số tài khoản và tên chủ tài khoản.',
        },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message === 'payment_provider_not_ready') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Cổng thanh toán này chưa hoàn tất xác thực merchant và webhook. Hệ thống đang chặn để tránh tạo giao dịch giả lập.',
        },
        { status: 409 },
      )
    }

    if (error instanceof Error && error.message.startsWith('payment-provider-config-missing:')) {
      const provider = error.message.split(':')[1]
      return NextResponse.json({ ok: false, message: `Cổng ${provider} chưa đủ thông tin merchant trong CMS.` }, { status: 400 })
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Không thể xử lý yêu cầu nạp sao lúc này.',
      },
      { status: 500 },
    )
  }
}
