import { NextResponse } from 'next/server'

import { listPublicArticles } from '@/lib/public-articles'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const articles = await listPublicArticles()
    return NextResponse.json({ ok: true, articles }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Public article feed failed', error)
    return NextResponse.json(
      { ok: false, articles: [] },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  }
}
