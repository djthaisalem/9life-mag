import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { cmsArtistRows, cmsOutletRows } from '@/lib/cms-dashboard-data'
import { getSiteAccountById, updatePortalManagementAssignment } from '@/lib/site-user-session'

const updateSchema = z.object({
  portalRole: z.enum(['manager', 'booking']),
  portalAccessStatus: z.enum(['pending', 'approved', 'suspended']),
  managedAgent: z.string().max(160).optional(),
  managedOutletSlugs: z.array(z.string().min(1)).max(50).default([]),
})

function choices() {
  return {
    agents: [...new Set(cmsArtistRows.map((artist) => artist.agent))].sort(),
    outlets: cmsOutletRows.map((outlet) => ({ slug: outlet.slug, name: outlet.name, city: outlet.city })),
  }
}

export async function GET(_: Request, context: { params: Promise<{ accountId: string }> }) {
  const access = await requireCmsApiAccess('api_security')
  if (!access.ok) return access.response

  const { accountId } = await context.params
  const account = await getSiteAccountById(accountId)
  if (!account || account.accountType !== 'artist') {
    return NextResponse.json({ ok: false, message: 'Không tìm thấy tài khoản portal.' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    account: {
      id: account.id,
      portalRole: account.portalRole ?? 'artist',
      portalAccessStatus: account.portalAccessStatus ?? 'approved',
      managedAgent: account.managedAgent ?? '',
      managedOutletSlugs: account.managedOutletSlugs ?? [],
    },
    choices: choices(),
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ accountId: string }> }) {
  const access = await requireCmsApiAccess('api_security')
  if (!access.ok) return access.response

  try {
    const { accountId } = await context.params
    const input = updateSchema.parse(await request.json())
    const validAgents = new Set(choices().agents)
    const validOutlets = new Set(cmsOutletRows.map((outlet) => outlet.slug))

    if (input.portalRole === 'manager' && !validAgents.has(input.managedAgent ?? '')) {
      return NextResponse.json({ ok: false, message: 'Vui lòng chọn Agent hợp lệ cho Manager.' }, { status: 400 })
    }
    if (input.portalRole === 'booking' && input.managedOutletSlugs.some((slug) => !validOutlets.has(slug))) {
      return NextResponse.json({ ok: false, message: 'Danh sách outlet có mục không hợp lệ.' }, { status: 400 })
    }

    const account = await updatePortalManagementAssignment({ accountId, ...input })
    if (!account) return NextResponse.json({ ok: false, message: 'Không tìm thấy tài khoản portal.' }, { status: 404 })
    return NextResponse.json({ ok: true, message: 'Đã lưu phân quyền và mapping vận hành.', account })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Dữ liệu phân quyền chưa hợp lệ.' }, { status: 400 })
    }
    return NextResponse.json({ ok: false, message: 'Chưa thể lưu phân quyền portal.' }, { status: 500 })
  }
}
