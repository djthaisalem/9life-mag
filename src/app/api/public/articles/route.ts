import { NextResponse } from 'next/server'

import { listPublicArticles } from '@/lib/public-articles'

export async function GET() {
  try {
    const articles = await listPublicArticles()
    return NextResponse.json({ ok: true, articles }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Public article feed failed', error)
    return NextResponse.json({ ok: false, articles: [] }, { status: 500 })
  }
}
