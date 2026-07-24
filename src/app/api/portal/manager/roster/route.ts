import { NextResponse } from 'next/server'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getArtistAgentAssignments } from '@/lib/site-user-session'
import { loadPayloadClient } from '@/lib/payload-runtime'

export async function GET() {
  const account = await getArtistPortalApiAccess('manager')
  if (!account) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền Manager.' }, { status: 403 })

  const agent = account.managedAgent?.trim()
  if (!agent) return NextResponse.json({ ok: true, agent: '', artists: [] })

  const assignments = await getArtistAgentAssignments()
  const overrides = new Map(assignments.map((item) => [item.artistProfileSlug, item.artistAgent || 'Independent Artist']))
  const assignedSlugs = [...overrides.entries()]
    .filter(([, assignedAgent]) => assignedAgent === agent)
    .map(([slug]) => slug)

  if (!assignedSlugs.length) {
    return NextResponse.json({ ok: true, agent, artists: [] })
  }

  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: 'artists',
    limit: 1000,
    depth: 0,
    pagination: false,
  })
  const artists = (result.docs as Array<Record<string, unknown>>)
    .filter((artist) => typeof artist.slug === 'string' && assignedSlugs.includes(artist.slug))
    .map((artist) => ({
      name: typeof artist.stageName === 'string' ? artist.stageName : 'Nghệ sĩ chưa đặt tên',
      slug: String(artist.slug),
      role: typeof artist.role === 'string' ? artist.role : 'Chưa cập nhật vai trò',
      profile: typeof artist.profileStatus === 'string' ? artist.profileStatus : 'draft',
      release: 'Đang đồng bộ phát hành',
      booking: artist.isAvailable === false ? 'Tạm ngưng nhận booking' : 'Sẵn sàng nhận booking',
    }))
  return NextResponse.json({ ok: true, agent, artists })
}
