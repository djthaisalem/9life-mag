import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsBookingRequestsPanel } from '@/components/cms-booking-requests-panel'
import { CmsTelegramBookingConfigForm } from '@/components/cms-telegram-booking-config-form'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'
import { getTelegramPaymentConfig } from '@/lib/payment-config'

export default async function CmsBookingPage() {
  const allBookingRows = await getBookingRequestsSnapshot()
  const telegram = await getTelegramPaymentConfig()

  return (
    <CmsDashboardShell
      activeKey="booking"
      title="Tất Cả Booking"
      description="Trang này gom toàn bộ booking trên site chính để đội vận hành theo dõi nhanh, sau đó có thể chuyển sang từng tab chức năng để xử lý sâu hơn."
    >
      <div className="cms-booking-tabs">
        <Link href="/cms/dashboard/booking" className="cms-booking-tab cms-booking-tab-active">
          Tất cả
        </Link>
        <Link href="/cms/dashboard/booking/artists" className="cms-booking-tab">
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
            <h2>Kênh tổng quản lý booking toàn site</h2>
          </div>
        </div>

        <CmsTelegramBookingConfigForm channel={telegram.channel} tokenConfigured={Boolean(telegram.token)} />
      </article>

      <CmsBookingRequestsPanel
        rows={allBookingRows}
        title="Danh sách booking tổng hợp"
        description="Hiển thị cả booking nghệ sĩ và đặt bàn để bạn nhìn toàn cảnh hoạt động từ mới đến cũ."
      />
    </CmsDashboardShell>
  )
}
