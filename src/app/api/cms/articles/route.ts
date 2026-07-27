import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { getCmsArticleHtml, getCmsMediaReference } from '@/lib/cms-article-content'
import { buildArticleSeoMarkup, extractArticleSeoMetadata, stripArticleSeoMetadata } from '@/lib/article-seo-metadata'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { toUrlSlug } from '@/lib/url-slug'

const articleSchema = z.object({
  title: z.string().trim().min(2).max(240),
  slug: z.string().trim().max(180).default(''),
  category: z.string().trim().min(2).max(120).default('Tin tức'),
  topic: z.string().trim().max(120).default(''),
  placement: z.string().trim().max(160).default('Feed tin tức'),
  excerpt: z.string().trim().max(800).default(''),
  html: z.string().trim().default(''),
  coverImageId: z.string().trim().regex(/^\d+$/).optional(),
  galleryImageIds: z.array(z.string().trim().regex(/^\d+$/)).max(20).default([]),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
})

function getCategoryName(value: unknown) {
  if (!value || typeof value !== 'object') return 'Tin tức'
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' && name.trim() ? name : 'Tin tức'
}

function getOptionalCategoryName(value: unknown) {
  if (!value || typeof value !== 'object') return ''
  const name = (value as { name?: unknown }).name
  return typeof name === 'string' ? name : ''
}

async function getOrCreateCategoryId(payload: Awaited<ReturnType<typeof loadPayloadClient>>, name: string, kind: 'category' | 'topic' = 'category') {
  const slug = kind === 'topic' ? `topic-${toUrlSlug(name)}` : toUrlSlug(name)
  const found = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const existing = found.docs[0]
  if (existing) return existing.id

  const category = await payload.create({
    collection: 'categories',
    depth: 0,
    overrideAccess: true,
    data: { name, slug, description: `[news-taxonomy:${kind}]` },
  })
  return category.id
}

export async function GET(request: Request) {
  const access = await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  const slug = new URL(request.url).searchParams.get('slug')?.trim()
  if (!slug) return NextResponse.json({ ok: false, message: 'Thiếu slug bài viết.' }, { status: 400 })

  try {
    const payload = await loadPayloadClient()
    const found = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    const post = found.docs[0]
    if (!post) return NextResponse.json({ ok: false, message: 'Không tìm thấy bài viết đã lưu.' }, { status: 404 })

    return NextResponse.json({
      ok: true,
      post: {
        id: String(post.id),
        title: post.title,
        slug: post.slug,
        category: getCategoryName(post.category),
        topic: getOptionalCategoryName(post.topic),
        placement: post.placement ?? 'Feed tin tức',
        excerpt: post.excerpt ?? '',
        html: stripArticleSeoMetadata(getCmsArticleHtml(post.content)),
        status: post.status,
        coverImage: getCmsMediaReference(post.coverImage),
        gallery: Array.isArray(post.gallery)
          ? post.gallery.map(getCmsMediaReference).filter(Boolean)
          : [],
      },
    })
  } catch (error) {
    console.error('CMS article read failed', { slug, error })
    return NextResponse.json({ ok: false, message: 'Không thể đọc bài viết đã lưu lúc này.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const access = await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  try {
    const input = articleSchema.parse(await request.json())
    const slug = toUrlSlug(input.slug || input.title)
    if (slug.length < 2) return NextResponse.json({ ok: false, message: 'Chưa thể tạo slug hợp lệ từ tiêu đề bài viết.' }, { status: 400 })
    const payload = await loadPayloadClient()
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const categoryId = await getOrCreateCategoryId(payload, input.category)
    const topicId = input.topic ? await getOrCreateCategoryId(payload, input.topic, 'topic') : undefined
    const seoMetadata = extractArticleSeoMetadata(input.html)
    const articleHtml = [stripArticleSeoMetadata(input.html), buildArticleSeoMarkup(seoMetadata)].filter(Boolean).join('')
    const content = articleHtml ? { root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: articleHtml, detail: 0, format: 0, mode: 'normal', style: '' }], direction: null, format: '', indent: 0 }] } } : undefined
    const data = {
      title: input.title,
      slug,
      category: categoryId,
      topic: topicId,
      placement: input.placement,
      excerpt: input.excerpt || undefined,
      content,
      coverImage: input.coverImageId ? Number(input.coverImageId) : undefined,
      gallery: input.galleryImageIds.map(Number),
      status: input.status,
      publishedAt: input.status === 'published' ? new Date().toISOString() : undefined,
      seoTitle: seoMetadata.title || input.title,
      seoDescription: seoMetadata.description || input.excerpt || undefined,
    }
    const existingPost = found.docs[0]
    const post = existingPost
      ? await payload.update({ collection: 'posts', id: existingPost.id, depth: 0, overrideAccess: true, data })
      : await payload.create({ collection: 'posts', depth: 0, overrideAccess: true, data })
    return NextResponse.json({ ok: true, message: 'Đã lưu bài viết vào database.', post: { id: post.id, slug: post.slug } })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Dữ liệu bài viết chưa hợp lệ.' }, { status: 400 })
    console.error('CMS article save failed', error)
    return NextResponse.json({ ok: false, message: 'Không thể lưu bài viết vào database lúc này.' }, { status: 500 })
  }
}
