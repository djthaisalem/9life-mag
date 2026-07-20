import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsBookingRequestsPanel } from '@/components/cms-booking-requests-panel'
import { cmsTelegramBookingConfig } from '@/lib/cms-dashboard-data'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'

export default async function CmsOutletBookingPage() {
  const outletBookingRows = (await getBookingRequestsSnapshot()).filter((item) => item.type === 'outlet')

  return (
    <CmsDashboardShell
      activeKey="booking"
      title="Đặt Bàn"
      description="Tab này chỉ quản lý các yêu cầu đặt bàn outlet từ site chính, sắp xếp từ mới đến cũ để đội vận hành xác nhận nhanh."
    >
      <div className="cms-booking-tabs">
        <Link href="/cms/dashboard/booking" className="cms-booking-tab">
          Tất cả
        </Link>
        <Link href="/cms/dashboard/booking/artists" className="cms-booking-tab">
          Booking nghệ sĩ
        </Link>
        <Link href="/cms/dashboard/booking/outlets" className="cms-booking-tab cms-booking-tab-active">
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
            <h2>Kênh tổng cho đặt bàn outlet</h2>
          </div>
        </div>

        <form className="form-shell cms-embedded-form">
          <div className="cms-form-two">
            <div className="field">
              <label htmlFor="telegramBotTokenOutlet">Telegram bot token mặc định</label>
              <input id="telegramBotTokenOutlet" type="password" defaultValue={cmsTelegramBookingConfig.tokenDefault} />
            </div>
            <div className="field">
              <label htmlFor="telegramOutletGlobalChannel">Channel tổng đặt bàn</label>
              <input
                id="telegramOutletGlobalChannel"
                defaultValue={cmsTelegramBookingConfig.globalChannel}
                placeholder="@9lifemag_booking_ops"
              />
            </div>
          </div>
        </form>
      </article>

      <CmsBookingRequestsPanel
        rows={outletBookingRows}
        title="Danh sách đặt bàn"
        description="Chỉ hiển thị các yêu cầu giữ bàn, cọc bàn và đặt bàn tại outlet/night club."
        showTypeColumn={false}
      />
    </CmsDashboardShell>
  )
}
