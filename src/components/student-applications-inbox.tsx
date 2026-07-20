'use client'

import { useEffect, useState } from 'react'

type Application = { id: string; fullName: string; email: string; phone: string; city: string; experience: string; learningGoal: string; availability: string; referenceLink: string; status: 'new' | 'accepted' | 'declined'; createdAt: string }

export function StudentApplicationsInbox({ title = 'Đơn đăng ký học viên' }: { title?: string }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [message, setMessage] = useState('')

  async function load() {
    const response = await fetch('/api/student-applications', { cache: 'no-store' })
    const result = await response.json() as { ok?: boolean; message?: string; applications?: Application[] }
    if (!result.ok) { setMessage(result.message ?? 'Chưa thể tải đơn học viên.'); return }
    setApplications(result.applications ?? [])
  }

  useEffect(() => { void load() }, [])

  async function decide(id: string, status: 'accepted' | 'declined') {
    const response = await fetch('/api/student-applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    const result = await response.json() as { ok?: boolean; message?: string; applications?: Application[] }
    if (!result.ok) { setMessage(result.message ?? 'Chưa thể cập nhật đơn.'); return }
    setApplications(result.applications ?? [])
    setMessage(status === 'accepted' ? 'Đã tiếp nhận học viên.' : 'Đã từ chối đơn đăng ký.')
  }

  return <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Student applications</p><h2>{title}</h2><p className="artist-editor-panel-note">Chỉ bạn và CMS admin được xem. Bạn là người duy nhất có quyền tiếp nhận hoặc từ chối.</p></div><button type="button" className="button-secondary" onClick={() => void load()}>Tải lại</button></div>{message ? <p className="form-feedback">{message}</p> : null}<div className="artist-booking-list">{applications.length ? applications.map((item) => <article key={item.id} className="artist-booking-row"><div><span className="artist-booking-label">Học viên</span><strong>{item.fullName}</strong><p>{item.email} · {item.phone}{item.city ? ` · ${item.city}` : ''}</p></div><div><span className="artist-booking-label">Mục tiêu</span><strong>{item.learningGoal}</strong><p>{item.experience || 'Chưa cung cấp kinh nghiệm'}{item.availability ? ` · ${item.availability}` : ''}</p></div><div><span className="artist-booking-label">Trạng thái</span><strong>{item.status === 'accepted' ? 'Đã tiếp nhận' : item.status === 'declined' ? 'Từ chối' : 'Mới'}</strong>{item.status === 'new' ? <p className="cms-inline-actions"><button type="button" className="button" onClick={() => void decide(item.id, 'accepted')}>Tiếp nhận</button><button type="button" className="button-secondary" onClick={() => void decide(item.id, 'declined')}>Từ chối</button></p> : null}</div></article>) : <div className="artist-booking-empty">Chưa có đơn học viên mới. Khi có đăng ký từ profile, đơn sẽ xuất hiện tại đây.</div>}</div></article>
}
