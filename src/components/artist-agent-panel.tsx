'use client'

import { useEffect, useState } from 'react'

export function ArtistAgentPanel() {
  const [agent, setAgent] = useState('')
  const [agents, setAgents] = useState<string[]>([])
  const [nextAgent, setNextAgent] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [tickets, setTickets] = useState<Array<{ id: string; status: string; newAgent: string }>>([])

  useEffect(() => { void fetch('/api/portal/artist/agent').then(async (response) => ({ response, body: await response.json() as { ok: boolean; agent?: string; agents?: string[]; tickets?: Array<{ id: string; status: string; newAgent: string }> } })).then(({ response, body }) => { if (response.ok && body.ok) { setAgent(body.agent ?? ''); setAgents(body.agents ?? []); setTickets(body.tickets ?? []) } }).catch(() => setMessage('Không thể tải thông tin Agent.')) }, [])

  async function submit() {
    const response = await fetch('/api/portal/artist/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newAgent: nextAgent, reason }) })
    const body = await response.json() as { ok: boolean; message?: string }
    setMessage(body.message ?? (body.ok ? 'Đã gửi ticket.' : 'Chưa thể gửi ticket.'))
    if (body.ok) {
      setShowChangeForm(false)
      setNextAgent('')
      setReason('')
    }
  }

  async function appeal(ticketId: string) { const response = await fetch('/api/portal/artist/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'appeal', ticketId, note: reason }) }); const body = await response.json() as { ok: boolean; message?: string }; setMessage(body.message ?? 'Chưa thể gửi khiếu nại.') }

  const isIndependentChoice = nextAgent === 'Independent Artist'
  return <article className="artist-dashboard-panel artist-agent-panel"><p className="section-eyebrow">Artist Management</p><h2>Agent quản lý</h2><div className="artist-dashboard-card-actions"><p className="artist-editor-panel-note">{agent || 'Nghệ sĩ tự do'}</p><button type="button" className="button-secondary" onClick={() => setShowChangeForm(true)}>Thay đổi Agent</button></div>{message ? <p className="form-feedback">{message}</p> : null}{tickets.filter((ticket) => ticket.status === 'old_agent_rejected').map((ticket) => <div key={ticket.id} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Agent cũ đã từ chối chuyển sang {ticket.newAgent}. <button type="button" className="button-secondary" onClick={() => void appeal(ticket.id)}>Gửi khiếu nại</button></p></div>)}{showChangeForm ? <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="agent-change-title"><div className="cms-editor-modal"><div className="cms-editor-modal-head"><div><strong id="agent-change-title">Thay đổi Agent</strong><span>Chọn Agent mới hoặc chuyển sang Nghệ sĩ tự do.</span></div><button type="button" className="button-secondary" onClick={() => setShowChangeForm(false)}>Đóng</button></div><div className="cms-editor-modal-form"><div className="field"><label>Agent muốn chuyển đến</label><select value={nextAgent} onChange={(event) => setNextAgent(event.target.value)}><option value="">Chọn Agent</option>{agents.map((item) => <option key={item} value={item}>{item === 'Independent Artist' ? 'Nghệ sĩ tự do' : item}</option>)}</select></div><div className="field"><label>Lý do (không bắt buộc)</label><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: thay đổi định hướng quản lý" /></div>{isIndependentChoice ? <p className="artist-editor-panel-note">Agent hiện tại cần chấp thuận yêu cầu này; trạng thái Nghệ sĩ tự do không cần Agent mới phê duyệt.</p> : null}<button type="button" className="button-primary" disabled={!nextAgent} onClick={() => void submit()}>{isIndependentChoice ? 'Gửi yêu cầu chuyển tự do' : 'Gửi ticket đổi Agent'}</button></div></div></div> : null}</article>
}
