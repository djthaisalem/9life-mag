import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getArtistAgency } from '@/lib/artist-agency-data'
import { getStoredArtistAgency, updateStoredArtistAgency } from '@/lib/artist-agency-store'

const profileSchema = z.object({
  label: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  coverage: z.string().trim().min(2).max(180),
  image: z.string().url().max(800),
  description: z.string().trim().min(30).max(1200),
  specialties: z.array(z.string().trim().min(2).max(100)).min(1).max(8),
  services: z.array(z.string().trim().min(2).max(100)).min(1).max(10),
})

async function getManagedAgency() {
  const account = await getArtistPortalApiAccess('manager')
  const agency = account?.managedAgent ? getArtistAgency(account.managedAgent) : undefined
  return { account, agency }
}

export async function GET() {
  const { account, agency } = await getManagedAgency()
  if (!account || !agency) return NextResponse.json({ ok: false, message: 'Tài khoản Manager chưa được map với Agent hợp lệ.' }, { status: 403 })
  return NextResponse.json({ ok: true, agency: await getStoredArtistAgency(agency.slug) })
}

export async function PATCH(request: Request) {
  const { account, agency } = await getManagedAgency()
  if (!account || !agency) return NextResponse.json({ ok: false, message: 'Tài khoản Manager chưa được map với Agent hợp lệ.' }, { status: 403 })
  try {
    const input = profileSchema.parse(await request.json())
    const updated = await updateStoredArtistAgency(agency.slug, input)
    return NextResponse.json({ ok: true, agency: updated, message: 'Đã lưu profile Agent.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Thông tin Agent chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể lưu profile Agent.' }, { status: 500 })
  }
}
