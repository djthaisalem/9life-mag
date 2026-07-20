'use client'

import { useEffect, useState } from 'react'

export function StudentRegistrationSettings() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void fetch('/api/portal/student-registration-settings', { cache: 'no-store' })
      .then(async (response) => ({ response, body: await response.json() as { ok?: boolean; enabled?: boolean; message?: string } }))
      .then(({ response, body }) => { if (!response.ok || !body.ok) { setMessage(body.message ?? 'Chưa thể tải thiết lập.'); return }; setEnabled(body.enabled === true) })
      .catch(() => setMessage('Chưa thể tải thiết lập.'))
      .finally(() => setLoading(false))
  }, [])

  async function update(nextEnabled: boolean) {
    setEnabled(nextEnabled)
    setMessage('')
    const response = await fetch('/api/portal/student-registration-settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: nextEnabled }) })
    const result = await response.json() as { ok?: boolean; message?: string }
    if (!response.ok || !result.ok) { setEnabled(!nextEnabled); setMessage(result.message ?? 'Chưa thể lưu thiết lập.'); return }
    setMessage(nextEnabled ? 'Đã mở nhận đăng ký học viên trên profile công khai.' : 'Đã ẩn đăng ký học viên khỏi profile công khai.')
  }

  return <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Student registration</p><h2>Nhận đăng ký học viên</h2><p className="artist-editor-panel-note">Chỉ khi bật, box đăng ký mới hiển thị trên profile công khai. Bạn là người duy nhất tiếp nhận hoặc từ chối đơn.</p></div></div><label className="student-registration-setting"><input type="checkbox" checked={enabled} disabled={loading} onChange={(event) => void update(event.target.checked)} /><span><strong>{enabled ? 'Đang mở nhận học viên' : 'Đang ẩn đăng ký học viên'}</strong><small>{enabled ? 'Form đang hiển thị trên profile và có thể nhận đơn mới.' : 'Profile công khai không hiển thị form; các đơn cũ vẫn chỉ bạn và CMS admin xem được.'}</small></span></label>{message ? <p className="form-feedback">{message}</p> : null}</article>
}
