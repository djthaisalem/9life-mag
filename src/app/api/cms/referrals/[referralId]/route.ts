import { NextResponse } from 'next/server'
import { hasTrustedCmsRequestOrigin, requireCmsApiAccess } from '@/lib/cms-access'
import { verifyCmsCapabilityToken } from '@/lib/cms-capability'
import { deleteCmsReferral } from '@/lib/share-referrals'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ referralId: string }> },
) {
  if (!await hasTrustedCmsRequestOrigin()) {
    return NextResponse.json({ ok: false, message: 'Origin không hợp lệ cho thao tác nhạy cảm.' }, { status: 403 })
  }

  const authorization = request.headers.get('authorization')
  const capability = verifyCmsCapabilityToken(
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null,
    'stars',
  )
  const access = capability ? { ok: true as const, session: capability } : await requireCmsApiAccess('stars')
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
