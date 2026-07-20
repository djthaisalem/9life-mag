'use client'

import { useEffect, useState } from 'react'

type Ticket = { id: string; oldAgent: string; newAgent: string; reason: string; status: string; oldAgentDecision: string; newAgentDecision: string }

export function AgentTicketQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [message, setMessage] = useState('')
  async function load() { const response = await fetch('/api/portal/agent-tickets', { cache: 'no-store' }); const body = await response.json() as { ok: boolean; message?: string; tickets?: Ticket[] }; if (response.ok && body.ok) setTickets(body.tickets ?? []); else setMessage(body.message ?? 'Không thể tải ticket.') }
  useEffect(() => { void load() }, [])
  async function decide(ticketId: string, decision: 'accepted' | 'rejected') { const response = await fetch('/api/portal/agent-tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId, decision }) }); const body = await response.json() as { ok: boolean; message?: string }; setMessage(body.message ?? (body.ok ? 'Đã cập nhật ticket.' : 'Chưa thể cập nhật ticket.')); if (body.ok) void load() }
  const pending = tickets.filter((ticket) => ticket.status === 'pending')
  return <article className="artist-dashboard-panel talent-management-workspace"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Agent approvals</p><h2>Ticket chuyển Agent</h2><p className="artist-editor-panel-note">Chấp thuận khi Agent của bạn đồng ý chuyển giao hoặc tiếp nhận nghệ sĩ.</p></div></div>{message ? <p className="form-feedback">{message}</p> : null}{pending.length ? <div className="artist-dashboard-update-list">{pending.map((ticket) => <div key={ticket.id} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>{ticket.oldAgent}</strong> → <strong>{ticket.newAgent}</strong>{ticket.reason ? ` · ${ticket.reason}` : ''}<br /><button type="button" className="button-secondary" onClick={() => void decide(ticket.id, 'accepted')}>Chấp nhận</button><button type="button" className="button-secondary" onClick={() => void decide(ticket.id, 'rejected')}>Từ chối</button></p></div>)}</div> : <p className="muted">Không có ticket cần bạn xử lý.</p>}</article>
}
