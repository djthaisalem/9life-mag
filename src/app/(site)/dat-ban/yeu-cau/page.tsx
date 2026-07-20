import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { clubOutlets } from '@/lib/club-booking-data'

const tableBookingFlow = [
  {
    title: 'Chọn outlet',
    body: 'Xác định club, khu vực bàn, số khách và khung giờ mong muốn để giữ đúng vibe đêm đi chơi.',
  },
  {
    title: 'Giữ chỗ tạm',
    body: 'Team vận hành kiểm tra tình trạng bàn, mức minimum spend và các yêu cầu đi kèm nếu có.',
  },
  {
    title: 'Xác nhận',
    body: 'Chốt đầu mối liên hệ, giờ đến, dịp đặt bàn và lưu ý setup để gửi xác nhận nhanh.',
  },
  {
    title: 'Check-in đêm diễn',
    body: 'Hoàn tất bàn đã giữ, hỗ trợ check-in và đồng bộ thêm nếu nhóm muốn nâng hạng hoặc thêm dịch vụ.',
  },
]

export default async function TableRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ outlet?: string }>
}) {
  const { outlet: outletSlug } = await searchParams
  const selectedOutlet = clubOutlets.find((item) => item.slug === outletSlug)

  return (
    <main>
      <PageHero
        eyebrow="Table Reservation"
        title="Đặt bàn outlet"
        intro="Form này dành riêng cho khách đặt bàn tại night club và lounge. Nội dung tập trung vào outlet, số lượng khách, khung giờ, loại bàn và các nhu cầu đi nhóm."
      />

      <section className="section">
        <div className="container booking-grid">
          <div className="booking-form-column">
            <div className="artist-profile-cta-row">
              <button type="button" className="button">
                Đặt Bàn
              </button>
              <Link href="/booking" className="button-secondary">
                Booking Nghệ Sĩ
              </Link>
            </div>

            <form className="form-shell">
              <div className="field">
                <label htmlFor="outlet">Outlet mong muốn</label>
                <select id="outlet" name="outlet">
                  {selectedOutlet ? <option>{selectedOutlet.name}</option> : <option>Chọn outlet / night club</option>}
                  {clubOutlets
                    .filter((item) => item.slug !== selectedOutlet?.slug)
                    .map((outlet) => (
                      <option key={outlet.slug}>{outlet.name}</option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bookingDate">Ngày đi</label>
                <input id="bookingDate" name="bookingDate" type="date" />
              </div>
              <div className="field">
                <label htmlFor="arrivalTime">Khung giờ đến</label>
                <select id="arrivalTime" name="arrivalTime">
                  <option>20:00 - 21:00</option>
                  <option>21:00 - 22:00</option>
                  <option>22:00 - 23:00</option>
                  <option>Sau 23:00</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="guestCount">Số lượng khách</label>
                <input id="guestCount" name="guestCount" placeholder="Ví dụ: 8 khách" />
              </div>
              <div className="field">
                <label htmlFor="tableType">Loại bàn mong muốn</label>
                <select id="tableType" name="tableType">
                  <option>Standard table</option>
                  <option>VIP table</option>
                  <option>Birthday setup</option>
                  <option>Group booth</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="budget">Ngân sách / minimum spend dự kiến</label>
                <input id="budget" name="budget" placeholder="15.000.000 VND" />
              </div>
              <div className="field">
                <label htmlFor="contactName">Tên người đặt</label>
                <input id="contactName" name="contactName" placeholder="Nguyễn Văn B" />
              </div>
              <div className="field">
                <label htmlFor="contactPhone">Số điện thoại</label>
                <input id="contactPhone" name="contactPhone" placeholder="090x xxx xxx" />
              </div>
              <div className="field">
                <label htmlFor="occasion">Dịp đặt bàn</label>
                <select id="occasion" name="occasion">
                  <option>Đi chơi cuối tuần</option>
                  <option>Sinh nhật</option>
                  <option>Tiếp khách / đối tác</option>
                  <option>After party</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="notes">Ghi chú thêm</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Muốn gần DJ booth, cần trang trí sinh nhật, ưu tiên bàn không hút thuốc..."
                />
              </div>
              <div className="artist-profile-cta-row">
                <button type="submit" className="button">
                  Gửi
                </button>
              </div>
            </form>
          </div>

          <div className="timeline">
            {tableBookingFlow.map((step) => (
              <article key={step.title} className="timeline-item">
                <h3>{step.title}</h3>
                <p className="muted">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
