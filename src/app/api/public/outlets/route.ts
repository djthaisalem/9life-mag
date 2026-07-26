import { NextResponse } from 'next/server'

import { listPublishedOutlets } from '@/lib/public-outlets'

export async function GET() {
  try {
    const records = await listPublishedOutlets()
    return NextResponse.json({ ok: true, outlets: records.map((record) => record.outlet) })
  } catch (error) {
    console.error('Public outlet list failed', error)
    return NextResponse.json({ ok: false, outlets: [] }, { status: 500 })
  }
}
