import { NextResponse } from 'next/server'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { cmsArtistRows } from '@/lib/cms-dashboard-data'
import { getArtistAgentAssignments } from '@/lib/site-user-session'

export async function GET() {
  const account = await getArtistPortalApiAccess('manager')
  if (!account) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền Manager.' }, { status: 403 })

  const agent = account.managedAgent?.trim()
  if (!agent) return NextResponse.json({ ok: true, agent: '', artists: [] })

  const assignments = await getArtistAgentAssignments()
  const overrides = new Map(assignments.map((item) => [item.artistProfileSlug, item.artistAgent || 'Independent Artist']))
  const artists = cmsArtistRows.filter((artist) => (overrides.get(artist.slug) ?? artist.agent) === agent).map((artist) => ({
    name: artist.name,
    slug: artist.slug,
    role: artist.field,
    profile: artist.visibility,
    release: 'Đang đồng bộ phát hành',
    booking: artist.availability,
  }))
  return NextResponse.json({ ok: true, agent, artists })
}
