import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { artistProfiles } from '@/lib/artist-directory-data'

const pipeline = [
  {
    title: 'New request',
    body: 'Ghi nhận nghệ sĩ quan tâm, loại sự kiện, thời gian dự kiến và thông tin người phụ trách.',
  },
  {
    title: 'Qualification',
    body: 'Đánh giá venue, ngân sách, format biểu diễn, kỹ thuật sân khấu và mức độ phù hợp của artist.',
  },
  {
    title: 'Negotiation',
    body: 'Điều phối báo giá, lịch nghệ sĩ, rider, media support và các yêu cầu hợp đồng.',
  },
  {
    title: 'Won / Lost',
    body: 'Khóa trạng thái cuối cùng, gửi xác nhận booking và bàn giao đầu mối vận hành show.',
  },
]

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistSlug } = await searchParams
  const selectedArtist = artistProfiles.find((item) => item.slug === artistSlug)
  const isArtistLocked = Boolean(selectedArtist)

  return (
    <main>
      <PageHero
        eyebrow="Artist Booking"
        title="Booking nghệ sĩ"
        intro="Form này dành riêng cho DJ, MC, rapper và performer. Nội dung tập trung vào show diễn, timeline vận hành, ngân sách và yêu cầu sân khấu để team booking xử lý nhanh hơn."
      />

      <section className="section">
        <div className="container booking-grid">
          <div className="booking-form-column">
            <div className="artist-profile-cta-row">
              <button type="button" className="button">
                Booking Nghệ Sĩ
              </button>
              <Link href="/dat-ban/yeu-cau" className="button-secondary">
                Đặt Bàn
              </Link>
            </div>

            <form className="form-shell">
              <div className="field">
                <label htmlFor="eventName">Tên sự kiện</label>
                <input id="eventName" name="eventName" placeholder="Summer Rooftop Party 2026" />
              </div>
              <div className="field">
                <label htmlFor="artist">Nghệ sĩ mong muốn</label>
                {isArtistLocked ? (
                  <>
                    <input id="artist" name="artistName" value={selectedArtist!.name} readOnly />
                    <input type="hidden" name="artistSlug" value={selectedArtist!.slug} />
                  </>
                ) : (
                  <select id="artist" name="artist">
                    <option>Chọn nghệ sĩ quan tâm</option>
                    {artistProfiles.slice(0, 20).map((artist) => (
                      <option key={artist.slug}>{artist.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="field">
                <label htmlFor="showDate">Ngày biểu diễn dự kiến</label>
                <input id="showDate" name="showDate" type="date" />
              </div>
              <div className="field">
                <label htmlFor="eventLocation">Địa điểm / thành phố</label>
                <input id="eventLocation" name="eventLocation" placeholder="TP.HCM - Quận 1" />
              </div>
              <div className="field">
                <label htmlFor="performanceType">Loại show</label>
                <select id="performanceType" name="performanceType">
                  <option>Club night</option>
                  <option>Festival / headline</option>
                  <option>Private event</option>
                  <option>Brand activation</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="soundcheck">Soundcheck</label>
                <input
                  id="soundcheck"
                  name="soundcheck"
                  placeholder="Gợi ý: 17:00, ngày 20/07/2026 tại booth chính hoặc sân khấu tổng duyệt"
                />
              </div>
              <div className="field">
                <label htmlFor="budget">Ngân sách dự kiến</label>
                <input id="budget" name="budget" placeholder="30.000.000 VND" />
              </div>
              <div className="field">
                <label htmlFor="contactName">Người liên hệ</label>
                <input id="contactName" name="contactName" placeholder="Nguyễn Văn A" />
              </div>
              <div className="field">
                <label htmlFor="contactPhone">Số điện thoại / Zalo</label>
                <input id="contactPhone" name="contactPhone" placeholder="090x xxx xxx" />
              </div>
              <div className="field">
                <label htmlFor="notes">Mô tả thêm</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Audience, set time, kỹ thuật sân khấu, media support, concept đêm diễn..."
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
            {pipeline.map((step) => (
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
