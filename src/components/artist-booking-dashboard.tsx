'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { BookingRequestRecord } from '@/lib/booking-requests'
import { ArtistPrivateContactPanel } from '@/components/artist-private-contact-panel'
import { StudentApplicationsInbox } from '@/components/student-applications-inbox'

type BookingTab = 'receiving' | 'accepted' | 'cancelled'

type ArtistBookingDashboardProps = {
  artistRows: BookingRequestRecord[]
  venueRows: BookingRequestRecord[]
}

const tabs: { key: BookingTab; label: string }[] = [
  { key: 'receiving', label: 'Đang tiếp nhận' },
  { key: 'accepted', label: 'Đã tiếp nhận' },
  { key: 'cancelled', label: 'Hủy' },
]

function repairText(value: string) {
  if (!/(?:Ã.|Ä.|á[º»]|Æ.|â€)/.test(value)) return value
  try {
    return new TextDecoder().decode(Uint8Array.from(value, (character) => character.charCodeAt(0)))
  } catch {
    return value
  }
}

function getTab(row: BookingRequestRecord): BookingTab {
  const status = repairText(row.status).toLocaleLowerCase('vi')
  if (status.includes('hủy') || status.includes('huỷ') || status.includes('từ chối')) return 'cancelled'
  if (status.includes('xác nhận') || status.includes('đã cọc') || status.includes('hoàn tất') || status.includes('đã tiếp nhận')) return 'accepted'
  return 'receiving'
}

function getSoundcheck(row: BookingRequestRecord) {
  return row.submittedFields.find((field) => repairText(field.label).toLocaleLowerCase('vi').includes('soundcheck'))?.value ?? 'Chưa có lịch soundcheck'
}

export function ArtistBookingDashboard({ artistRows, venueRows }: ArtistBookingDashboardProps) {
  const [activeTab, setActiveTab] = useState<BookingTab>('receiving')
  const rows = useMemo(() => artistRows.filter((row) => getTab(row) === activeTab), [activeTab, artistRows])
  const acceptedRows = artistRows.filter((row) => getTab(row) === 'accepted')

  return (
    <main className="artist-editor-page artist-booking-page">
      <section className="artist-dashboard-hero artist-editor-hero">
        <div className="container artist-editor-hero-row">
          <div className="artist-editor-copy">
            <p className="section-eyebrow">Booking center</p>
            <h1>Booking của bạn</h1>
            <p className="section-intro">Theo dõi yêu cầu biểu diễn và lịch đặt bàn của bạn. Các booking được xử lý bởi đội vận hành, vì vậy thông tin ở đây chỉ để xem và chuẩn bị.</p>
          </div>
        </div>
        <div className="container artist-dashboard-stats">
          <article className="artist-dashboard-stat"><strong>{artistRows.filter((row) => getTab(row) === 'receiving').length}</strong><span>Đang tiếp nhận</span></article>
          <article className="artist-dashboard-stat"><strong>{acceptedRows.length}</strong><span>Đã tiếp nhận</span></article>
          <article className="artist-dashboard-stat"><strong>{venueRows.length}</strong><span>Lượt đặt bàn đã dùng</span></article>
        </div>
        <nav className="container artist-editor-tabs" aria-label="Điều hướng dashboard nghệ sĩ">
          <Link href="/tai-khoan/nghe-si/dashboard" className="artist-editor-tab">Dashboard</Link>
          <Link href="/tai-khoan/nghe-si/dashboard/profile" className="artist-editor-tab">Profile</Link>
          <Link href="/tai-khoan/nghe-si/dashboard/music" className="artist-editor-tab">Music</Link>
          <Link href="/tai-khoan/nghe-si/dashboard/media" className="artist-editor-tab">Video & media</Link>
          <Link href="/tai-khoan/nghe-si/dashboard/content" className="artist-editor-tab">Editorial</Link>
          <Link href="/tai-khoan/nghe-si/dashboard/booking" className="artist-editor-tab artist-editor-tab-active">Booking</Link>
        </nav>
      </section>

      <section className="section">
        <div className="container artist-booking-layout">
          <div className="artist-dashboard-column">
            <StudentApplicationsInbox />
            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Artist requests</p><h2>Yêu cầu Booking nghệ sĩ</h2><p className="artist-editor-panel-note">Chọn trạng thái để xem các yêu cầu liên quan đến lịch biểu diễn của bạn.</p></div></div>
              <div className="artist-booking-tabs">
                {tabs.map((tab) => <button key={tab.key} type="button" className={`artist-editor-tab${activeTab === tab.key ? ' artist-editor-tab-active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
              </div>
              <div className="artist-booking-list">
                {rows.length ? rows.map((row) => <article key={row.id} className="artist-booking-row">
                  <div><span className="artist-booking-label">Đơn vị liên hệ</span><strong>{repairText(row.requester)}</strong><p>{repairText(row.detail)}</p></div>
                  <div><span className="artist-booking-label">Địa điểm</span><strong>{repairText(row.location)}</strong><p>{repairText(row.schedule)}</p></div>
                  <div><span className="artist-booking-label">Soundcheck</span><strong>{repairText(getSoundcheck(row))}</strong><p className={`artist-booking-status artist-booking-status-${getTab(row)}`}>{tabs.find((tab) => tab.key === getTab(row))?.label}</p></div>
                </article>) : <div className="artist-booking-empty">Chưa có booking trong trạng thái này. Khi có yêu cầu mới, đội vận hành sẽ cập nhật tại đây.</div>}
              </div>
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Venue history</p><h2>Lịch sử đặt bàn của bạn</h2><p className="artist-editor-panel-note">Danh sách này chỉ hiển thị những lượt đặt bàn được tạo từ tài khoản nghệ sĩ của bạn.</p></div></div>
              <div className="artist-booking-list">
                {venueRows.length ? venueRows.map((row) => <article key={row.id} className="artist-booking-row">
                  <div><span className="artist-booking-label">Outlet</span><strong>{repairText(row.title)}</strong><p>{repairText(row.detail)}</p></div>
                  <div><span className="artist-booking-label">Địa phương</span><strong>{repairText(row.location)}</strong><p>{repairText(row.schedule)}</p></div>
                  <div><span className="artist-booking-label">Trạng thái</span><strong>{tabs.find((tab) => tab.key === getTab(row))?.label}</strong></div>
                </article>) : <div className="artist-booking-empty">Bạn chưa có lịch sử đặt bàn từ tài khoản nghệ sĩ. Các lượt đặt bàn sau này sẽ tự động xuất hiện tại đây.</div>}
              </div>
            </article>
          </div>

          <aside className="artist-dashboard-side">
            <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Show preparation</p><h2>Chuẩn bị trước show</h2></div></div><div className="artist-dashboard-update-list"><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Xác nhận giờ soundcheck và người liên hệ tại venue trước khi di chuyển.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Chuẩn bị rider, danh sách khách mời và yêu cầu kỹ thuật nếu booking đã được tiếp nhận.</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Liên hệ đội vận hành nếu cần điều chỉnh lịch hoặc có thay đổi quan trọng.</p></div></div></article>
            <ArtistPrivateContactPanel />
          </aside>
        </div>
      </section>
    </main>
  )
}
