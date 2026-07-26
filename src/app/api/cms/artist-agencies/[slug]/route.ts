import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { getStoredArtistAgency, updateStoredArtistAgency, updateStoredArtistAgencyStatus } from '@/lib/artist-agency-store'

const profileSchema = z.object({
  label: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  coverage: z.string().trim().min(2).max(180),
  image: z.string().url().max(800),
  description: z.string().trim().min(30).max(1200),
  specialties: z.array(z.string().trim().min(2).max(100)).min(1).max(8),
  services: z.array(z.string().trim().min(2).max(100)).min(1).max(10),
})
const statusSchema = z.object({ action: z.literal('set-status'), status: z.enum(['pending_review', 'published', 'suspended', 'cancelled']) })

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const access = await requireCmsApiAccess('artists')
  if (!access.ok) return access.response
  const { slug } = await context.params
  const agency = await getStoredArtistAgency(slug)
  if (!agency) return NextResponse.json({ ok: false, message: 'Không tìm thấy Agent.' }, { status: 404 })
  return NextResponse.json({ ok: true, agency })
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const access = await requireCmsApiAccess('artists')
  if (!access.ok) return access.response
  try {
    const { slug } = await context.params
    const body = await request.json()
    const statusInput = statusSchema.safeParse(body)
    if (statusInput.success) {
      const agency = await updateStoredArtistAgencyStatus(slug, statusInput.data.status)
      if (!agency) return NextResponse.json({ ok: false, message: 'Không tìm thấy Agent.' }, { status: 404 })
      return NextResponse.json({ ok: true, agency, message: 'Đã cập nhật trạng thái Agent.' })
    }
    const input = profileSchema.parse(body)
    const agency = await updateStoredArtistAgency(slug, input)
    if (!agency) return NextResponse.json({ ok: false, message: 'Không tìm thấy Agent.' }, { status: 404 })
    return NextResponse.json({ ok: true, agency, message: 'Đã lưu profile Agent.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Thông tin Agent chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể lưu profile Agent.' }, { status: 500 })
  }
}
