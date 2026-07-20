import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { decideAgentChangeTicket, getAgentChangeTickets } from '@/lib/portal-notifications'

export async function GET() {
  const account = await getArtistPortalApiAccess('manager')
  if (!account?.managedAgent) return NextResponse.json({ ok: false, message: 'Manager chưa được map với Agent.' }, { status: 403 })
  return NextResponse.json({ ok: true, tickets: await getAgentChangeTickets(account.managedAgent) })
}

export async function POST(request: Request) {
  const account = await getArtistPortalApiAccess('manager')
  if (!account?.managedAgent) return NextResponse.json({ ok: false, message: 'Manager chưa được map với Agent.' }, { status: 403 })
  try {
    const input = z.object({ ticketId: z.string().min(1), decision: z.enum(['accepted', 'rejected']) }).parse(await request.json())
    return NextResponse.json({ ok: true, ticket: await decideAgentChangeTicket({ ...input, agent: account.managedAgent }) })
  } catch {
    return NextResponse.json({ ok: false, message: 'Không thể cập nhật ticket Agent.' }, { status: 400 })
  }
}
