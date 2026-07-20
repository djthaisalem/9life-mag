import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { cmsArtistRows, DEFAULT_ARTIST_AGENT } from '@/lib/cms-dashboard-data'
import { appealAgentChangeTicket, createAgentChangeTicket, getAgentChangeTickets } from '@/lib/portal-notifications'

const ticketSchema = z.object({ newAgent: z.string().min(1).max(160), reason: z.string().max(800).default('') })
const agentChoices = () => [DEFAULT_ARTIST_AGENT, ...new Set(cmsArtistRows.map((artist) => artist.agent).filter((agent) => agent !== DEFAULT_ARTIST_AGENT))].sort((a, b) => a === DEFAULT_ARTIST_AGENT ? -1 : b === DEFAULT_ARTIST_AGENT ? 1 : a.localeCompare(b))

export async function GET() {
  const account = await getArtistPortalApiAccess('artist')
  if (!account) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền Artist.' }, { status: 403 })
  return NextResponse.json({ ok: true, agent: account.artistAgent ?? '', agents: agentChoices(), tickets: await getAgentChangeTickets(undefined, account.id) })
}

export async function POST(request: Request) {
  const account = await getArtistPortalApiAccess('artist')
  if (!account) return NextResponse.json({ ok: false, message: 'Bạn chưa được cấp quyền Artist.' }, { status: 403 })
  try {
    const body = await request.json()
    if (body.action === 'appeal') {
      const input = z.object({ ticketId: z.string().min(1), note: z.string().max(800).default('') }).parse(body)
      await appealAgentChangeTicket({ ticketId: input.ticketId, artistAccountId: account.id, note: input.note })
      return NextResponse.json({ ok: true, message: 'Đã gửi khiếu nại đến Admin.' })
    }
    const input = ticketSchema.parse(body)
    if (!agentChoices().includes(input.newAgent)) return NextResponse.json({ ok: false, message: 'Agent được chọn không hợp lệ.' }, { status: 400 })
    const oldAgent = account.artistAgent?.trim() || DEFAULT_ARTIST_AGENT
    if (oldAgent === input.newAgent) return NextResponse.json({ ok: false, message: 'Bạn đang thuộc Agent này.' }, { status: 400 })
    await createAgentChangeTicket({ artistAccountId: account.id, oldAgent, newAgent: input.newAgent, reason: input.reason })
    return NextResponse.json({ ok: true, message: input.newAgent === DEFAULT_ARTIST_AGENT ? 'Đã gửi yêu cầu chuyển sang Nghệ sĩ tự do. Agent hiện tại cần chấp thuận.' : 'Đã gửi ticket đổi Agent. Admin và hai Agent liên quan đã nhận thông báo.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Thông tin ticket chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể gửi ticket lúc này.' }, { status: 500 })
  }
}
