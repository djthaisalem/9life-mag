'use client'

import { Check, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type PortalRole = 'manager' | 'booking'
type RegionFilter = 'all' | 'mien-bac' | 'mien-trung' | 'mien-nam'
type MappingData = {
  account: { portalRole: PortalRole | 'artist'; portalAccessStatus: 'pending' | 'approved' | 'suspended'; managedAgent: string; managedOutletSlugs: string[] }
  choices: { agents: string[]; outlets: Array<{ slug: string; name: string; city: string; region: string }> }
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111|\u0110/g, 'd').toLowerCase()
}

function regionId(value: string): Exclude<RegionFilter, 'all'> {
  const normalized = normalize(value)
  if (normalized.includes('trung')) return 'mien-trung'
  if (normalized.includes('bac')) return 'mien-bac'
  return 'mien-nam'
}

export function CmsPortalRoleMapping({ accountId }: { accountId: string }) {
  const capability = useCmsCapability('api_security')
  const [data, setData] = useState<MappingData | null>(null)
  const [message, setMessage] = useState('Đang tải cấu hình portal...')
  const [outletQuery, setOutletQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')

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
  const visibleOutlets = data.choices.outlets.filter((outlet) => {
    const matchesRegion = regionFilter === 'all' || regionId(outlet.region) === regionFilter
    return matchesRegion && normalize(`${outlet.name} ${outlet.city} ${outlet.region}`).includes(normalize(outletQuery.trim()))
  })
  const toggleOutlet = (slug: string) => setData({ ...data, account: { ...data.account, managedOutletSlugs: data.account.managedOutletSlugs.includes(slug) ? data.account.managedOutletSlugs.filter((item) => item !== slug) : [...data.account.managedOutletSlugs, slug] } })

  return <article className="cms-access-card"><div className="cms-panel-head-inline"><div><p className="section-eyebrow">Portal Approval</p><h2>Duyệt và map phạm vi vận hành</h2><p className="cms-muted">{isManager ? 'Manager chỉ thấy nghệ sĩ thuộc Agent được chọn.' : 'Booking Coordinator chỉ thấy booking của các Outlet được map.'}</p></div></div>
    <div className="cms-form-two"><div className="field"><label>Vai trò đăng ký</label><select value={data.account.portalRole} onChange={(event) => setData({ ...data, account: { ...data.account, portalRole: event.target.value as PortalRole, managedAgent: '', managedOutletSlugs: [] } })}><option value="manager">Manager</option><option value="booking">Booking Coordinator</option></select></div><div className="field"><label>Trạng thái duyệt</label><select value={data.account.portalAccessStatus} onChange={(event) => setData({ ...data, account: { ...data.account, portalAccessStatus: event.target.value as MappingData['account']['portalAccessStatus'] } })}><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="suspended">Tạm khóa</option></select></div></div>
    {isManager ? <div className="field"><label>Map với Agent</label><select value={data.account.managedAgent} onChange={(event) => setData({ ...data, account: { ...data.account, managedAgent: event.target.value } })}><option value="">Chọn Agent</option>{data.choices.agents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}</select></div> : <div className="field"><label>Map với Outlet</label><div className="cms-outlet-mapping-toolbar"><label className="cms-outlet-mapping-search"><Search size={17} /><input value={outletQuery} onChange={(event) => setOutletQuery(event.target.value)} placeholder="Tìm theo tên Outlet hoặc tỉnh thành" /></label><span>{data.account.managedOutletSlugs.length} Outlet đã map</span></div><div className="cms-booking-tabs" role="tablist" aria-label="Lọc Outlet theo vùng miền">{([{ id: 'all', label: 'Tất cả' }, { id: 'mien-bac', label: 'Miền Bắc' }, { id: 'mien-trung', label: 'Miền Trung' }, { id: 'mien-nam', label: 'Miền Nam' }] as Array<{ id: RegionFilter; label: string }>).map((item) => <button key={item.id} type="button" role="tab" aria-selected={regionFilter === item.id} className={regionFilter === item.id ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} onClick={() => setRegionFilter(item.id)}>{item.label}</button>)}</div><div className="cms-outlet-mapping-list">{visibleOutlets.length ? visibleOutlets.map((outlet) => { const checked = data.account.managedOutletSlugs.includes(outlet.slug); return <article key={outlet.slug} className={checked ? 'cms-outlet-mapping-row is-mapped' : 'cms-outlet-mapping-row'}><div><strong>{outlet.name}</strong><span>{outlet.city} · {outlet.region}</span></div><button type="button" className={checked ? 'cms-outlet-map-toggle is-mapped' : 'cms-outlet-map-toggle'} onClick={() => toggleOutlet(outlet.slug)} aria-pressed={checked}>{checked ? <><Check size={17} /> Đã map</> : <><X size={17} /> Chưa map</>}</button></article> }) : <p className="cms-muted">Không tìm thấy Outlet phù hợp.</p>}</div></div>}
    {message ? <p className="form-feedback">{message}</p> : null}<button type="button" className="button" onClick={() => void save()}>Lưu phân quyền portal</button>
  </article>
}
