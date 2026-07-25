import { NextResponse } from 'next/server'
import { getStarPackages } from '@/lib/star-packages'

export async function GET() {
  return NextResponse.json({ ok: true, packages: await getStarPackages() })
}
