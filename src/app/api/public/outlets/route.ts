import { NextResponse } from 'next/server'

import { listPublishedOutlets } from '@/lib/public-outlets'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const records = await listPublishedOutlets()
    return NextResponse.json({ ok: true, outlets: records.map((record) => record.outlet) }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error) {
    console.error('Public outlet list failed', error)
    return NextResponse.json({ ok: false, outlets: [] }, { status: 500 })
  }
}
