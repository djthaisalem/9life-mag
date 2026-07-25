import { NextResponse } from 'next/server'
import { getStarPackages } from '@/lib/star-packages'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { ok: true, packages: await getStarPackages() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
