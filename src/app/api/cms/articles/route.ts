import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireCmsApiAccess } from '@/lib/cms-access'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { toUrlSlug } from '@/lib/url-slug'

const articleSchema = z.object({
  title: z.string().trim().min(2).max(240),
  slug: z.string().trim().max(180).default(''),
  excerpt: z.string().trim().max(800).default(''),
  html: z.string().trim().max(300_000).default(''),
})

export async function POST(request: Request) {
  const access = await requireCmsApiAccess('content')
  if (!access.ok) return access.response

  try {
    const input = articleSchema.parse(await request.json())
    const slug = toUrlSlug(input.slug || input.title)
    if (slug.length < 2) return NextResponse.json({ ok: false, message: 'Chưa thể tạo slug hợp lệ từ tiêu đề bài viết.' }, { status: 400 })
    const payload = await loadPayloadClient()
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const content = input.html ? { root: { type: 'root', version: 1, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: input.html, detail: 0, format: 0, mode: 'normal', style: '' }], direction: null, format: '', indent: 0 }] } } : undefined
    const data = { title: input.title, slug, excerpt: input.excerpt || undefined, content, status: 'draft' as const, seoTitle: input.title, seoDescription: input.excerpt || undefined }
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
