import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { updateSiteAccountForCms } from '@/lib/site-user-session'

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional(),
  stars: z.coerce.number().int().min(0).max(1_000_000_000),
  isPremium: z.boolean(),
  isActive: z.boolean(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const access = await requireCmsApiAccess('api_security')
  if (!access.ok) return access.response

  try {
    const { accountId } = await context.params
    const input = updateUserSchema.parse(await request.json())
    const account = await updateSiteAccountForCms({ accountId, ...input })

    if (!account) {
      return NextResponse.json(
        { ok: false, message: 'Không tìm thấy tài khoản cần cập nhật.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Đã lưu thông tin tài khoản.',
      account,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Thông tin tài khoản chưa hợp lệ.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { ok: false, message: 'Không thể lưu tài khoản lúc này.' },
      { status: 500 },
    )
  }
}
