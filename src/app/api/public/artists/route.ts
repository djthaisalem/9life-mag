import { NextResponse } from 'next/server'

import { listPublishedArtists } from '@/lib/public-artists'

export async function GET() {
  try {
    const records = await listPublishedArtists()
    return NextResponse.json({ ok: true, artists: records.map((record) => record.artist) })
  } catch (error) {
    console.error('Public artist list failed', error)
    return NextResponse.json({ ok: false, artists: [] }, { status: 500 })
  }
}
