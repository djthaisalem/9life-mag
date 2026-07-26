import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { createStoredArtistAgency, listStoredArtistAgencies } from '@/lib/artist-agency-store'

const schema = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), label: z.string().trim().min(2).max(120), location: z.string().trim().min(2).max(120), coverage: z.string().trim().min(2).max(180), image: z.string().url().max(800), description: z.string().trim().min(30).max(1200), specialties: z.array(z.string().trim().min(2).max(100)).min(1).max(8), services: z.array(z.string().trim().min(2).max(100)).min(1).max(10) })

export async function GET() { const access = await requireCmsApiAccess('artists'); if (!access.ok) return access.response; return NextResponse.json({ ok: true, agencies: await listStoredArtistAgencies() }) }
export async function POST(request: Request) { const access = await requireCmsApiAccess('artists'); if (!access.ok) return access.response; try { const agency = await createStoredArtistAgency(schema.parse(await request.json())); return NextResponse.json({ ok: true, agency, message: 'Đã tạo Agent và chuyển sang chờ duyệt.' }) } catch (error) { return NextResponse.json({ ok: false, message: error instanceof z.ZodError ? 'Thông tin Agent chưa hợp lệ.' : 'Không thể tạo Agent. Slug có thể đã tồn tại.' }, { status: 400 }) } }
