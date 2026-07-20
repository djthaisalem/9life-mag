import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsTelegramBookingConfig, getCmsOutletBySlug } from '@/lib/cms-dashboard-data'

export default async function CmsOutletDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const outlet = getCmsOutletBySlug(slug)

  if (!outlet) notFound()

  return (
    <CmsDashboardShell
      activeKey="outlets"
      title={`Outlet: ${outlet.name}`}
      description="Trang edit outlet để nhập đầy đủ thông tin profile và channel Telegram riêng nhận booking cho venue này."
    >
      <div className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
            <div>
              <p className="section-eyebrow">Outlet Profile</p>
              <h2>Thông tin profile outlet</h2>
            </div>
            <div className="cms-inline-actions">
              <Link href="/cms/dashboard/outlets" className="button-secondary">
                Quay lại danh sách
              </Link>
              <Link href="/cms/dashboard/booking/outlets" className="button-secondary">
                Sang booking outlet
              </Link>
            </div>
          </div>

          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="outletName">Tên outlet</label>
              <input id="outletName" defaultValue={outlet.name} />
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="outletRegion">Miền / khu vực</label>
                <input id="outletRegion" defaultValue={outlet.region} />
              </div>
              <div className="field">
                <label htmlFor="outletCity">Địa phương</label>
                <input id="outletCity" defaultValue={outlet.city} />
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="outletHours">Giờ hoạt động</label>
                <input id="outletHours" defaultValue={outlet.hours} />
              </div>
              <div className="field">
                <label htmlFor="outletVisibility">Hiển thị</label>
                <select id="outletVisibility" defaultValue={outlet.visibility}>
                  <option>Đang public</option>
                  <option>Nháp nội bộ</option>
                  <option>Tạm ẩn</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="outletVibe">Định vị / vibe</label>
              <textarea id="outletVibe" defaultValue={outlet.vibe} />
            </div>
            <div className="field">
              <label htmlFor="outletSummary">Giới thiệu đầy đủ</label>
              <textarea
                id="outletSummary"
                defaultValue={`${outlet.name} là outlet tại ${outlet.city}, phù hợp các nhóm khách muốn trải nghiệm nightlife có định vị rõ ràng, thông tin bàn minh bạch và có thể booking trực tiếp từ site chính.`}
              />
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="section-eyebrow">Booking Config</p>
          <h2>Telegram riêng của outlet</h2>
          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="outletTelegramChannel">Channel Telegram riêng</label>
              <input
                id="outletTelegramChannel"
                defaultValue={`@booking_${outlet.slug.replaceAll('-', '_')}`}
                placeholder="@booking_outlet_name"
              />
            </div>
            <div className="field">
              <label htmlFor="outletTelegramGlobal">Channel tổng quản lý booking</label>
              <input
                id="outletTelegramGlobal"
                defaultValue={cmsTelegramBookingConfig.globalChannel}
                placeholder="@9lifemag_booking_ops"
              />
            </div>
            <div className="field">
              <label htmlFor="outletTelegramToken">Telegram bot token mặc định</label>
              <input
                id="outletTelegramToken"
                type="password"
                defaultValue={cmsTelegramBookingConfig.tokenDefault}
              />
            </div>
            <div className="cms-inline-actions">
              <button type="button" className="button">
                Lưu cấu hình outlet
              </button>
            </div>
          </form>
        </article>
      </div>
    </CmsDashboardShell>
  )
}
