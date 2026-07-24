'use client'

import { useEffect, useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type Agency = { slug: string; name: string; label: string; location: string; coverage: string; image: string; description: string; specialties: string[]; services: string[] }

function splitItems(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)
}

export function ArtistAgencyProfileEditor({ endpoint, eyebrow = 'Agent Profile' }: { endpoint: string; eyebrow?: string }) {
  const capability = useCmsCapability('artists')
  const [agency, setAgency] = useState<Agency | null>(null)
  const [message, setMessage] = useState('Đang tải profile Agent...')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetch(endpoint, { cache: 'no-store', credentials: 'include', headers: capability ? { Authorization: `Bearer ${capability}` } : undefined })
      .then(async (response) => ({ response, body: await response.json() as { ok: boolean; message?: string; agency?: Agency } }))
      .then(({ response, body }) => {
        if (!response.ok || !body.ok || !body.agency) { setMessage(body.message ?? 'Không thể tải profile Agent.'); return }
        setAgency(body.agency)
        setMessage('')
      })
      .catch(() => setMessage('Không thể tải profile Agent.'))
  }, [endpoint, capability])

  async function save() {
    if (!agency) return
    setSaving(true)
    try {
      const response = await fetch(endpoint, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) }, body: JSON.stringify(agency) })
      const body = await response.json() as { ok: boolean; message?: string; agency?: Agency }
      if (body.ok && body.agency) setAgency(body.agency)
      setMessage(body.message ?? (body.ok ? 'Đã lưu profile Agent.' : 'Chưa thể lưu profile Agent.'))
    } catch {
      setMessage('Kết nối chưa ổn định, chưa thể lưu thay đổi.')
    } finally {
      setSaving(false)
    }
  }

  if (!agency) return <article className="artist-dashboard-panel"><p className="section-eyebrow">{eyebrow}</p><p className="muted">{message}</p></article>
  return <article className="artist-dashboard-panel artist-agency-editor"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">{eyebrow}</p><h2>Chỉnh sửa profile {agency.name}</h2><p className="artist-editor-panel-note">Nội dung sau khi lưu sẽ hiển thị trên trang Agent công khai.</p></div></div><div className="cms-form-two"><div className="field"><label>Tên định vị</label><input value={agency.label} onChange={(event) => setAgency({ ...agency, label: event.target.value })} /></div><div className="field"><label>Khu vực chính</label><input value={agency.location} onChange={(event) => setAgency({ ...agency, location: event.target.value })} /></div></div><div className="field"><label>Phạm vi hoạt động</label><input value={agency.coverage} onChange={(event) => setAgency({ ...agency, coverage: event.target.value })} /></div><div className="field"><label>Ảnh cover URL</label><input value={agency.image} onChange={(event) => setAgency({ ...agency, image: event.target.value })} placeholder="https://..." /></div><div className="field"><label>Giới thiệu Agent</label><textarea value={agency.description} onChange={(event) => setAgency({ ...agency, description: event.target.value })} /></div><div className="cms-form-two"><div className="field"><label>Thế mạnh (mỗi dòng một mục)</label><textarea value={agency.specialties.join('\n')} onChange={(event) => setAgency({ ...agency, specialties: splitItems(event.target.value) })} /></div><div className="field"><label>Dịch vụ (mỗi dòng một mục)</label><textarea value={agency.services.join('\n')} onChange={(event) => setAgency({ ...agency, services: splitItems(event.target.value) })} /></div></div>{message ? <p className="form-feedback">{message}</p> : null}<button type="button" className="button" disabled={saving} onClick={() => void save()}>{saving ? 'Đang lưu...' : 'Lưu profile Agent'}</button></article>
}
