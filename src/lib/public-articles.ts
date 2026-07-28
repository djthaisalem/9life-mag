import 'server-only'

import { getCmsMediaReference } from '@/lib/cms-article-content'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

export type PublicNewsArticle = {
  slug: string
  title: string
  summary: string
  category: string
  topic?: string
  placement?: string
  date: string
  publishedAt: string
  image: string
}

function taxonomyName(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return fallback
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' && name.trim() ? repairVietnameseText(name) : fallback
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export async function listPublicArticles(): Promise<PublicNewsArticle[]> {
  const payload = await loadPayloadClient()
  const firstPage = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 100,
    page: 1,
    depth: 1,
    overrideAccess: true,
  })
  const docs = [...firstPage.docs]

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 100,
      page,
      depth: 1,
      overrideAccess: true,
    })
    docs.push(...result.docs)
  }

  return docs.flatMap((post) => {
    if (!post.slug) return []
    const cover = getCmsMediaReference(post.coverImage)
    const publishedAt = post.publishedAt ?? post.updatedAt ?? ''
    return [{
      slug: post.slug,
      title: repairVietnameseText(post.title),
      summary: repairVietnameseText(post.excerpt ?? ''),
      category: taxonomyName(post.category, 'Tin tức'),
      topic: taxonomyName(post.topic, ''),
      placement: repairVietnameseText(post.placement ?? 'Feed tin tức'),
      date: formatDate(publishedAt),
      publishedAt,
      image: cover?.url ?? '/images/default-music-cover.png',
    }]
  }).sort((left, right) => {
    const leftTime = Date.parse(left.publishedAt)
    const rightTime = Date.parse(right.publishedAt)
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime)
  })
}
