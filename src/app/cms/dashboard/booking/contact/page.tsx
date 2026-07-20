import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsBookingRequestsPanel } from '@/components/cms-booking-requests-panel'
import { getBookingRequestsSnapshot } from '@/lib/booking-requests'

export default async function CmsContactRequestsPage() {
  const contactRows = (await getBookingRequestsSnapshot()).filter((item) => item.type === 'contact')

  return (
    <CmsDashboardShell
      activeKey="booking"
      title="Liên hệ"
      description="Tất cả yêu cầu quảng cáo, bản quyền, hợp tác và hỗ trợ từ site chính được tiếp nhận tại đây theo thứ tự mới nhất."
    >
      <div className="cms-booking-tabs">
        <Link href="/cms/dashboard/booking" className="cms-booking-tab">Tất cả</Link>
        <Link href="/cms/dashboard/booking/artists" className="cms-booking-tab">Booking nghệ sĩ</Link>
        <Link href="/cms/dashboard/booking/outlets" className="cms-booking-tab">Đặt bàn</Link>
        <Link href="/cms/dashboard/booking/contact" className="cms-booking-tab cms-booking-tab-active">Liên hệ</Link>
      </div>

      <CmsBookingRequestsPanel
        rows={contactRows}
        title="Danh sách liên hệ từ site chính"
        description="Mở từng yêu cầu để xem đầy đủ thông tin người gửi, tiếp nhận hoặc hủy và cấu hình nhắc việc Telegram khi cần."
        showTypeColumn={false}
      />
    </CmsDashboardShell>
  )
}
