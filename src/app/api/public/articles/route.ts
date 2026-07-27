import { NextResponse } from 'next/server'

import { getCmsMediaReference } from '@/lib/cms-article-content'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

function taxonomyName(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return fallback
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' && name.trim() ? name : fallback
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export async function GET() {
  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 100,
      depth: 1,
      pagination: false,
      overrideAccess: true,
    })
    const articles = result.docs.map((post) => {
      const cover = getCmsMediaReference(post.coverImage)
      return {
        slug: post.slug,
        title: repairVietnameseText(post.title),
        summary: repairVietnameseText(post.excerpt ?? ''),
        category: taxonomyName(post.category, 'Tin tức'),
        topic: taxonomyName(post.topic, ''),
        placement: post.placement ?? 'Feed tin tức',
        date: formatDate(post.publishedAt ?? post.updatedAt),
        image: cover?.url ?? 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=800&fit=crop',
      }
    })
    return NextResponse.json({ ok: true, articles }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Public article feed failed', error)
    return NextResponse.json({ ok: false, articles: [] }, { status: 500 })
  }
}
