import { NextResponse } from 'next/server'
import { getPublishedUserPlaylists } from '@/lib/shared-user-playlists'

export async function GET() {
  const playlists = await getPublishedUserPlaylists()
  return NextResponse.json(
    { ok: true, playlists },
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
  )
}
