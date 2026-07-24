import { NextResponse } from 'next/server'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { deleteCmsReferral } from '@/lib/share-referrals'

export async function DELETE(
  _: Request,
  context: { params: Promise<{ referralId: string }> },
) {
  const access = await requireCmsApiAccess('stars')
  if (!access.ok) return access.response

  try {
    const { referralId } = await context.params
    await deleteCmsReferral(referralId)
    return NextResponse.json({ ok: true, message: 'Đã xóa link referral.' })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Không thể xóa link referral này.' },
      { status: 400 },
    )
  }
}
