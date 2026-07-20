import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createCmsAccessRequest } from '@/lib/cms-access-requests'
import { getTrustedClientIp, guardCmsAccessRequestAttempts } from '@/lib/request-guard'

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email(), organization: z.string().trim().max(120).default(''), requestedRole: z.enum(['Editor', 'Artist Ops', 'Music Ops', 'Finance Ops', 'Agent']), note: z.string().trim().max(600).default('') })

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    const headerStore = await headers()
    const ip = getTrustedClientIp(headerStore)
    const guard = await guardCmsAccessRequestAttempts(payload.email, ip)
    if (!guard.ok) {
      return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })
    }

    const result = await createCmsAccessRequest(payload)
    return NextResponse.json({ ok: true, message: result.created ? 'Yêu cầu đã được gửi đến Phân quyền Admin để xét duyệt.' : 'Email này đã có một yêu cầu chờ xét duyệt.' })
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message ?? 'Dữ liệu chưa hợp lệ.' : 'Không thể gửi yêu cầu lúc này.'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
