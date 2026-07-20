import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsBookingRequestsPanel } from '@/components/cms-booking-requests-panel'
import { cmsTelegramBookingConfig } from '@/lib/cms-dashboard-data'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'

export default async function CmsArtistBookingPage() {
  const artistBookingRows = (await getBookingRequestsSnapshot()).filter((item) => item.type === 'artist')

  return (
    <CmsDashboardShell
      activeKey="booking"
      title="Booking Nghệ Sĩ"
      description="Tab này chỉ quản lý các yêu cầu booking nghệ sĩ từ site chính, sắp xếp từ mới đến cũ để đội vận hành báo giá và chốt lịch nhanh."
    >
      <div className="cms-booking-tabs">
        <Link href="/cms/dashboard/booking" className="cms-booking-tab">
          Tất cả
        </Link>
        <Link href="/cms/dashboard/booking/artists" className="cms-booking-tab cms-booking-tab-active">
          Booking nghệ sĩ
        </Link>
        <Link href="/cms/dashboard/booking/outlets" className="cms-booking-tab">
          Đặt bàn
        </Link>
        <Link href="/cms/dashboard/booking/contact" className="cms-booking-tab">
          Liên hệ
        </Link>
      </div>

      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Telegram Config</p>
            <h2>Kênh tổng cho booking nghệ sĩ</h2>
          </div>
        </div>

        <form className="form-shell cms-embedded-form">
          <div className="cms-form-two">
            <div className="field">
              <label htmlFor="telegramBotTokenArtist">Telegram bot token mặc định</label>
              <input id="telegramBotTokenArtist" type="password" defaultValue={cmsTelegramBookingConfig.tokenDefault} />
            </div>
            <div className="field">
              <label htmlFor="telegramArtistGlobalChannel">Channel tổng booking nghệ sĩ</label>
              <input
                id="telegramArtistGlobalChannel"
                defaultValue={cmsTelegramBookingConfig.globalChannel}
                placeholder="@9lifemag_booking_ops"
              />
            </div>
          </div>
        </form>
      </article>

      <CmsBookingRequestsPanel
        rows={artistBookingRows}
        title="Danh sách booking nghệ sĩ"
        description="Chỉ hiển thị các booking liên quan đến nghệ sĩ, DJ, MC, rapper, dancer và talent khác."
        showTypeColumn={false}
      />
    </CmsDashboardShell>
  )
}
