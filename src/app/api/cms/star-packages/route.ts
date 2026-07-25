import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { saveStarPackages } from '@/lib/star-packages'

const packageSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  amount: z.number().int().positive(),
  stars: z.number().int().positive(),
  benefits: z.array(z.string().max(120)).max(12),
})

export async function PUT(request: Request) {
  const access = await requireCmsApiAccess('stars')
  if (!access.ok) return access.response
  try {
    const body = z.object({ packages: z.array(packageSchema).min(1).max(20) }).parse(await request.json())
    return NextResponse.json({ ok: true, packages: await saveStarPackages(body.packages) })
  } catch {
    return NextResponse.json({ ok: false, message: 'Danh sach goi sao chua hop le.' }, { status: 400 })
  }
}
