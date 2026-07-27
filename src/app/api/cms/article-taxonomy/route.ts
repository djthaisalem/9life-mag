import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { toUrlSlug } from '@/lib/url-slug'

const taxonomySchema = z.object({
  kind: z.enum(['category', 'topic']),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
})

const defaultCategories = ['Sự kiện', 'Nightlife', 'Nghệ sĩ', 'Review', 'Hậu trường', 'Xu hướng', 'Âm nhạc']
const defaultTopics = ['Hot Topic', 'Music Pulse', 'Artist Move', 'Venue Mode']

function marker(kind: 'category' | 'topic') {
  return `[news-taxonomy:${kind}]`
}

function taxonomySlug(kind: 'category' | 'topic', name: string) {
  const slug = toUrlSlug(name)
  return kind === 'topic' ? `topic-${slug}` : slug
}

async function ensureTaxonomy() {
  const payload = await loadPayloadClient()
  const defaults = [
    ...defaultCategories.map((name) => ({ kind: 'category' as const, name })),
    ...defaultTopics.map((name) => ({ kind: 'topic' as const, name })),
  ]
  for (const entry of defaults) {
    const slug = taxonomySlug(entry.kind, entry.name)
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    if (!found.docs[0]) {
      await payload.create({ collection: 'categories', depth: 0, overrideAccess: true, data: { name: entry.name, slug, description: marker(entry.kind) } })
    }
  }
  return payload
}

function serializeTaxonomy(items: unknown[]) {
  const taxonomyItems = items.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const value = item as { id?: string | number; name?: unknown; description?: unknown }
    if (value.id === undefined || typeof value.name !== 'string') return []
    return [{ id: String(value.id), name: value.name, description: typeof value.description === 'string' ? value.description : '' }]
  })
  return {
    categories: taxonomyItems.filter((item) => item.description === marker('category')).map((item) => ({ id: item.id, name: item.name })),
    topics: taxonomyItems.filter((item) => item.description === marker('topic')).map((item) => ({ id: item.id, name: item.name, description: '' })),
  }
}

export async function GET() {
  const access = await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  try {
    const payload = await ensureTaxonomy()
    const result = await payload.find({ collection: 'categories', limit: 500, depth: 0, pagination: false, overrideAccess: true })
    return NextResponse.json({ ok: true, ...serializeTaxonomy(result.docs) })
  } catch (error) {
    console.error('CMS article taxonomy read failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể đọc danh mục bài viết lúc này.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const access = await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  try {
    const input = taxonomySchema.parse(await request.json())
    const payload = await ensureTaxonomy()
    const slug = taxonomySlug(input.kind, input.name)
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const entry = found.docs[0] ?? await payload.create({
      collection: 'categories',
      depth: 0,
      overrideAccess: true,
      data: { name: input.name, slug, description: marker(input.kind) },
    })
    return NextResponse.json({ ok: true, entry: { id: String(entry.id), name: entry.name, description: input.description } })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Dữ liệu taxonomy chưa hợp lệ.' }, { status: 400 })
    console.error('CMS article taxonomy save failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể tạo taxonomy lúc này.' }, { status: 500 })
  }
}
