'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PortalNotificationCenter } from '@/components/portal-notification-center'
import { AgentTicketQueue } from '@/components/agent-ticket-queue'
import { ArtistAgencyProfileEditor } from '@/components/artist-agency-profile-editor'
import { StudentApplicationsInbox } from '@/components/student-applications-inbox'
import { StudentRegistrationSettings } from '@/components/student-registration-settings'

type TalentManagementRole = 'manager' | 'booking'
type ManagerView = 'agency' | 'roster' | 'releases' | 'bookings' | 'media'
type BookingView = 'inbox' | 'schedule' | 'rider' | 'followup'
type OutletBooking = {
  id: string
  title: string
  requester: string
  location: string
  schedule: string
  detail: string
  status: string
}

const roster = [
  { name: 'Neon Viper', slug: 'neon-viper', role: 'DJ / Producer', profile: 'Chờ duyệt', release: '01 bản nháp', booking: '06 lead mới' },
  { name: 'Luna Flux', slug: 'luna-flux', role: 'Open Format DJ', profile: 'Đang hoạt động', release: '02 đã phát hành', booking: '03 đang trao đổi' },
  { name: 'Nova Fire', slug: 'nova-fire', role: 'Rapper / Performer', profile: 'Cần bổ sung', release: 'Chưa có', booking: '02 lead mới' },
]

const managerViews: Array<{ id: ManagerView; label: string; title: string; description: string }> = [
  { id: 'agency', label: 'Profile Agent', title: 'Hồ sơ đơn vị quản lý', description: 'Cập nhật giới thiệu, khu vực, hình ảnh và dịch vụ của Agent trên trang công khai.' },
  { id: 'roster', label: 'Roster nghệ sĩ', title: 'Nghệ sĩ đang phụ trách', description: 'Theo dõi hồ sơ, trạng thái duyệt và các đầu việc đang mở của từng nghệ sĩ.' },
  { id: 'releases', label: 'Phát hành', title: 'Phát hành cần rà soát', description: 'Kiểm tra bản nháp, cover, quyền phát hành và lịch công bố trước khi gửi duyệt.' },
  { id: 'bookings', label: 'Booking nghệ sĩ', title: 'Pipeline booking theo talent', description: 'Tập trung các cơ hội booking để manager phân công và theo dõi tiến độ.' },
  { id: 'media', label: 'Media kit', title: 'Tư liệu truyền thông', description: 'Rà soát ảnh, video, liên kết âm nhạc và thông tin giới thiệu cần dùng cho đối tác.' },
]

const bookingViews: Array<{ id: BookingView; label: string; title: string; description: string }> = [
  { id: 'inbox', label: 'Yêu cầu mới', title: 'Inbox đặt bàn', description: 'Các yêu cầu đặt bàn từ site chính, sắp xếp theo thời gian mới nhất.' },
  { id: 'schedule', label: 'Lịch vận hành', title: 'Lịch booking đã tiếp nhận', description: 'Theo dõi khách, số lượng, gói bàn và thời điểm cần chuẩn bị.' },
  { id: 'rider', label: 'Checklist venue', title: 'Checklist cho outlet', description: 'Các bước xác nhận cọc, bàn giữ, đầu mối tiếp đón và ghi chú dịch vụ.' },
  { id: 'followup', label: 'Cần theo dõi', title: 'Booking cần follow-up', description: 'Ưu tiên các yêu cầu đang báo giá hoặc cần khách xác nhận lại.' },
]

const bookingStatuses = ['Mới', 'Đang báo giá', 'Chờ chốt', 'Đã xác nhận', 'Giữ bàn', 'Đã cọc', 'Hoàn tất', 'Huỷ']

function ManagerWorkspace() {
  const [view, setView] = useState<ManagerView>('roster')
  const [managedRoster, setManagedRoster] = useState<typeof roster | null>(null)
  const [agentName, setAgentName] = useState('')
  const [message, setMessage] = useState('')
  const selected = managerViews.find((item) => item.id === view) ?? managerViews[0]
  const rosterItems = managedRoster ?? roster

  useEffect(() => {
    void fetch('/api/portal/manager/roster', { cache: 'no-store' })
      .then(async (response) => ({ response, body: await response.json() as { ok: boolean; message?: string; agent?: string; artists?: typeof roster } }))
      .then(({ response, body }) => {
        if (!response.ok || !body.ok) { setMessage(body.message ?? 'Không thể tải roster được map.'); return }
        setManagedRoster(body.artists ?? [])
        setAgentName(body.agent ?? '')
      })
      .catch(() => setMessage('Không thể tải roster được map.'))
  }, [])

  return <>
    <div className="artist-dashboard-module-grid" aria-label="Khu vực quản lý nghệ sĩ">
      {managerViews.map((item) => <button key={item.id} type="button" className={view === item.id ? 'artist-dashboard-module-card artist-dashboard-module-card-active' : 'artist-dashboard-module-card'} onClick={() => setView(item.id)}><strong>{item.label}</strong><p>{item.description}</p><span className="artist-dashboard-module-link">Mở khu vực</span></button>)}
    </div>
    <AgentTicketQueue />
    <StudentApplicationsInbox title="Đơn học viên đăng ký với Agent" />
    {view === 'agency' ? <><StudentRegistrationSettings /><ArtistAgencyProfileEditor endpoint="/api/portal/manager/agency" eyebrow="Manager Profile" /></> : null}
    {view !== 'agency' ? <article className="artist-dashboard-panel talent-management-workspace" id={view}>
      <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Manager workspace</p><h2>{selected.title}</h2><p className="artist-editor-panel-note">{selected.description}</p></div></div>
      {agentName ? <p className="cms-muted">Đang hiển thị nghệ sĩ thuộc Agent: <strong>{agentName}</strong>.</p> : null}{message ? <p className="form-feedback">{message}</p> : null}
      {view === 'roster' ? <div className="talent-management-table"><div className="talent-management-row talent-management-table-head"><span>Nghệ sĩ</span><span>Hồ sơ</span><span>Phát hành</span><span>Booking</span></div>{rosterItems.length ? rosterItems.map((artist) => <div key={artist.slug} className="talent-management-row"><strong><small>{artist.role}</small>{artist.name}</strong><span>{artist.profile}</span><span>{artist.release}</span><span>{artist.booking}</span><Link className="cms-table-link" href={`/nghe-si/${artist.slug}`}>Xem hồ sơ</Link></div>) : <p className="muted">Chưa có nghệ sĩ thuộc Agent này. Admin cần map Agent trong CMS.</p>}</div> : null}
      {view === 'releases' ? <div className="artist-dashboard-update-list">{rosterItems.map((artist) => <div key={artist.slug} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>{artist.name}</strong>: {artist.release}. Kiểm tra release tại dashboard của nghệ sĩ trước khi gửi duyệt.</p></div>)}</div> : null}
      {view === 'bookings' ? <div className="artist-dashboard-update-list">{rosterItems.map((artist) => <div key={artist.slug} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>{artist.name}</strong>: {artist.booking}. Manager có thể tổng hợp yêu cầu và điều phối với Booking Coordinator.</p></div>)}</div> : null}
      {view === 'media' ? <div className="artist-dashboard-update-list">{rosterItems.map((artist) => <div key={artist.slug} className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>{artist.name}</strong>: kiểm tra portrait, cover, video embed và media kit trước khi gửi đối tác.</p></div>)}</div> : null}
    </article> : null}
  </>
}

function BookingWorkspace() {
  const [view, setView] = useState<BookingView>('inbox')
  const [requests, setRequests] = useState<OutletBooking[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const selected = bookingViews.find((item) => item.id === view) ?? bookingViews[0]

  async function loadRequests() {
    setLoading(true)
    try {
      const response = await fetch('/api/portal/booking-requests', { cache: 'no-store' })
      const data = await response.json() as { ok: boolean; message?: string; requests?: OutletBooking[] }
      if (!response.ok || !data.ok) {
        setMessage(data.message ?? 'Không thể tải booking.')
        return
      }
      setRequests(data.requests ?? [])
    } catch {
      setMessage('Kết nối chưa ổn định. Vui lòng tải lại danh sách.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRequests() }, [])

  async function updateStatus(requestId: string, status: string) {
    setMessage('')
    const response = await fetch('/api/portal/booking-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, status }) })
    const data = await response.json() as { ok: boolean; message?: string; requests?: OutletBooking[] }
    if (!response.ok || !data.ok) {
      setMessage(data.message ?? 'Chưa thể cập nhật trạng thái.')
      return
    }
    setRequests(data.requests ?? [])
    setMessage('Đã cập nhật trạng thái booking.')
  }

  const visibleRequests = requests.filter((request) => {
    if (view === 'inbox') return request.status === 'Mới'
    if (view === 'schedule') return ['Đã xác nhận', 'Giữ bàn', 'Đã cọc'].includes(request.status)
    if (view === 'followup') return ['Đang báo giá', 'Chờ chốt'].includes(request.status)
    return true
  })

  return <>
    <div className="artist-dashboard-module-grid" aria-label="Khu vực điều phối booking">
      {bookingViews.map((item) => <button key={item.id} type="button" className={view === item.id ? 'artist-dashboard-module-card artist-dashboard-module-card-active' : 'artist-dashboard-module-card'} onClick={() => setView(item.id)}><strong>{item.label}</strong><p>{item.description}</p><span className="artist-dashboard-module-link">Mở khu vực</span></button>)}
    </div>
    <article className="artist-dashboard-panel talent-management-workspace" id={view}>
      <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Outlet booking workspace</p><h2>{selected.title}</h2><p className="artist-editor-panel-note">{selected.description}</p></div><button type="button" className="button-secondary" onClick={() => void loadRequests()}>Tải lại</button></div>
      {message ? <p className="form-feedback">{message}</p> : null}
      {loading ? <p className="muted">Đang tải booking...</p> : null}
      {!loading && view === 'rider' ? <div className="artist-dashboard-update-list"><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Xác nhận số khách, tiền cọc, bàn giữ và người tiếp đón trước giờ hẹn.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Ghi nhận yêu cầu sinh nhật, trang trí, check-in hoặc nhu cầu phát sinh của khách.</p></div></div> : null}
      {!loading && view !== 'rider' ? <div className="talent-management-schedule">{visibleRequests.length ? visibleRequests.map((request) => <article key={request.id}><time>{request.schedule}</time><div><strong>{request.title}</strong><span>{request.requester} · {request.location} · {request.detail}</span></div><div className="talent-booking-status-control"><select aria-label={`Trạng thái ${request.title}`} value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value)}>{bookingStatuses.map((status) => <option key={status}>{status}</option>)}</select><b>{request.status}</b></div></article>) : <p className="muted">Không có booking phù hợp trong khu vực này.</p>}</div> : null}
    </article>
  </>
}

export function TalentManagementDashboard({ role }: { role: TalentManagementRole }) {
  const isManager = role === 'manager'
  const title = isManager ? 'Không gian quản lý nghệ sĩ' : 'Trung tâm điều phối đặt bàn outlet'
  const intro = isManager ? 'Quản lý roster, tiến độ hồ sơ, phát hành và pipeline booking của các nghệ sĩ phụ trách.' : 'Tiếp nhận yêu cầu đặt bàn, cập nhật trạng thái và điều phối vận hành cho các outlet.'
  const metrics = isManager ? [{ value: '12', label: 'Nghệ sĩ trong roster' }, { value: '03', label: 'Hồ sơ chờ duyệt' }, { value: '07', label: 'Release đang xử lý' }, { value: '18', label: 'Booking cần theo dõi' }] : [{ value: '09', label: 'Yêu cầu mới' }, { value: '06', label: 'Đã tiếp nhận' }, { value: '04', label: 'Cần chuẩn bị' }, { value: '02', label: 'Cần follow-up' }]

  return <main className="artist-dashboard-page talent-management-page">
    <section className="artist-dashboard-hero"><div className="container artist-dashboard-hero-row"><div><p className="section-eyebrow">{isManager ? 'Manager Workspace' : 'Booking Coordinator Workspace'}</p><h1>{title}</h1><p className="section-intro">{intro}</p></div><div className="artist-dashboard-hero-actions"><PortalNotificationCenter /><Link href={isManager ? '#roster' : '#inbox'} className="button">{isManager ? 'Quản lý roster' : 'Mở đặt bàn'}</Link><Link href="/tai-khoan/nghe-si" className="button-secondary">Cổng nghệ sĩ</Link></div></div></section>
    <section className="section talent-management-summary"><div className="container artist-dashboard-stats artist-dashboard-stats-4">{metrics.map((item) => <article key={item.label} className="artist-dashboard-stat"><strong>{item.value}</strong><span>{item.label}</span></article>)}</div><div className="container talent-management-tabs"><Link href="/tai-khoan/nghe-si/dashboard" className="artist-editor-tab">Nghệ sĩ</Link><Link href="/tai-khoan/nghe-si/manager/dashboard" className={`artist-editor-tab${isManager ? ' artist-editor-tab-active' : ''}`}>Manager</Link><Link href="/tai-khoan/nghe-si/booking/dashboard" className={`artist-editor-tab${!isManager ? ' artist-editor-tab-active' : ''}`}>Booking Coordinator</Link></div></section>
    <section className="section"><div className="container">{isManager ? <ManagerWorkspace /> : <BookingWorkspace />}</div></section>
  </main>
}
