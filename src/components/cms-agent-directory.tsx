'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type Agency = { slug: string; name: string; label: string; location: string; coverage: string; status: 'pending_review' | 'published' | 'suspended' | 'cancelled' }
const labels = { pending_review: 'Chờ duyệt', published: 'Đã duyệt', suspended: 'Đình chỉ', cancelled: 'Đã hủy' }

export function CmsAgentDirectory({ agencies }: { agencies: Agency[] }) {
  const capability = useCmsCapability('artists'); const [rows, setRows] = useState(agencies); const [filter, setFilter] = useState<Agency['status'] | 'all'>('all'); const [message, setMessage] = useState('')
  const setStatus = async (slug: string, status: Agency['status']) => {
    const response = await fetch(`/api/cms/artist-agencies/${slug}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) }, body: JSON.stringify({ action: 'set-status', status }) }); const result = await response.json() as { ok: boolean; message?: string; agency?: Agency }; setMessage(result.message ?? 'Không thể cập nhật Agent.'); if (result.ok && result.agency) setRows((current) => current.map((agency) => agency.slug === slug ? result.agency! : agency))
  }
  const visible = filter === 'all' ? rows : rows.filter((agency) => agency.status === filter)
  return <><section className="cms-panel"><div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Agent Operations</p><h2>Agent thực tế</h2><p className="cms-muted">Tạo và duyệt Agent tại đây. Profile được đồng bộ với trang Agent và dashboard Manager.</p></div><Link className="button" href="/cms/dashboard/agents/new">Tạo Agent</Link></div><div className="cms-booking-tabs">{(['all', 'pending_review', 'published', 'suspended', 'cancelled'] as const).map((status) => <button type="button" key={status} className={`cms-booking-tab ${filter === status ? 'cms-booking-tab-active' : ''}`} onClick={() => setFilter(status)}>{status === 'all' ? 'Tất cả' : labels[status]}</button>)}</div>{message ? <p className="form-feedback">{message}</p> : null}<div className="cms-table-wrap"><table className="cms-table"><thead><tr><th>Agent</th><th>Định vị</th><th>Khu vực</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visible.map((agency) => <tr key={agency.slug}><td><strong>{agency.name}</strong><span>{agency.slug}</span></td><td>{agency.label}</td><td>{agency.location} · {agency.coverage}</td><td><span className="cms-status-chip">{labels[agency.status]}</span></td><td><div className="cms-table-actions"><Link className="cms-table-link" href={`/cms/dashboard/agents/${agency.slug}`}>Xem / sửa</Link><button className="cms-table-link" type="button" onClick={() => void setStatus(agency.slug, 'published')}>Duyệt</button><button className="cms-table-link" type="button" onClick={() => void setStatus(agency.slug, 'suspended')}>Đình chỉ</button><button className="cms-table-link" type="button" onClick={() => void setStatus(agency.slug, 'cancelled')}>Hủy</button></div></td></tr>)}</tbody></table></div></section></>
}
