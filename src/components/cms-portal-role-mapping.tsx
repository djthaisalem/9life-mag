'use client'

import { useEffect, useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type PortalRole = 'manager' | 'booking'
type MappingData = {
  account: { portalRole: PortalRole | 'artist'; portalAccessStatus: 'pending' | 'approved' | 'suspended'; managedAgent: string; managedOutletSlugs: string[] }
  choices: { agents: string[]; outlets: Array<{ slug: string; name: string; city: string }> }
}

export function CmsPortalRoleMapping({ accountId }: { accountId: string }) {
  const capability = useCmsCapability('api_security')
  const [data, setData] = useState<MappingData | null>(null)
  const [message, setMessage] = useState('Đang tải cấu hình portal...')

  useEffect(() => {
    void fetch(`/api/cms/portal-access/${accountId}`, { cache: 'no-store', credentials: 'include', headers: capability ? { Authorization: `Bearer ${capability}` } : undefined })
      .then(async (response) => ({ response, body: await response.json() as { ok: boolean; message?: string } & MappingData }))
      .then(({ response, body }) => {
        if (!response.ok || !body.ok) { setMessage(body.message ?? 'Tài khoản này chưa phải portal role.'); return }
        setData({ account: body.account, choices: body.choices })
        setMessage('')
      })
      .catch(() => setMessage('Không thể tải cấu hình portal.'))
  }, [accountId, capability])

  async function save() {
    if (!data || data.account.portalRole === 'artist') return
    const response = await fetch(`/api/cms/portal-access/${accountId}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) }, body: JSON.stringify(data.account) })
    const body = await response.json() as { ok: boolean; message?: string }
    setMessage(body.message ?? (body.ok ? 'Đã lưu mapping.' : 'Chưa thể lưu mapping.'))
  }

  if (!data) return <article className="cms-access-card"><p className="section-eyebrow">Portal Access</p><p className="muted">{message}</p></article>
  if (data.account.portalRole === 'artist') return <article className="cms-access-card"><p className="section-eyebrow">Portal Access</p><p className="muted">Tài khoản này là Artist, không cần map Manager hoặc Booking Coordinator.</p></article>

  const isManager = data.account.portalRole === 'manager'
  return <article className="cms-access-card"><div className="cms-panel-head-inline"><div><p className="section-eyebrow">Portal Approval</p><h2>Duyệt và map phạm vi vận hành</h2><p className="cms-muted">{isManager ? 'Manager chỉ thấy nghệ sĩ thuộc Agent được chọn.' : 'Booking Coordinator chỉ thấy booking của các outlet được chọn.'}</p></div></div>
    <div className="cms-form-two"><div className="field"><label>Vai trò đăng ký</label><select value={data.account.portalRole} onChange={(event) => setData({ ...data, account: { ...data.account, portalRole: event.target.value as PortalRole, managedAgent: '', managedOutletSlugs: [] } })}><option value="manager">Manager</option><option value="booking">Booking Coordinator</option></select></div><div className="field"><label>Trạng thái duyệt</label><select value={data.account.portalAccessStatus} onChange={(event) => setData({ ...data, account: { ...data.account, portalAccessStatus: event.target.value as MappingData['account']['portalAccessStatus'] } })}><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="suspended">Tạm khóa</option></select></div></div>
    {isManager ? <div className="field"><label>Map với Agent</label><select value={data.account.managedAgent} onChange={(event) => setData({ ...data, account: { ...data.account, managedAgent: event.target.value } })}><option value="">Chọn Agent</option>{data.choices.agents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}</select></div> : <div className="field"><label>Map với Outlet</label><div className="cms-permission-grid">{data.choices.outlets.map((outlet) => { const checked = data.account.managedOutletSlugs.includes(outlet.slug); return <label key={outlet.slug} className="cms-permission-chip"><input type="checkbox" checked={checked} onChange={() => setData({ ...data, account: { ...data.account, managedOutletSlugs: checked ? data.account.managedOutletSlugs.filter((slug) => slug !== outlet.slug) : [...data.account.managedOutletSlugs, outlet.slug] } })} /><span>{outlet.name} · {outlet.city}</span></label> })}</div></div>}
    {message ? <p className="form-feedback">{message}</p> : null}<button type="button" className="button" onClick={() => void save()}>Lưu phân quyền portal</button>
  </article>
}
