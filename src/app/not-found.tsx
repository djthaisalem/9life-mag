import { ArrowLeft, Compass, Headphones, Home, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'

const helpfulLinks = [
  {
    href: '/tin-tuc',
    label: 'Khám phá tin tức',
    description: 'Cập nhật sự kiện, nightlife và những câu chuyện mới.',
    icon: Compass,
  },
  {
    href: '/music',
    label: 'Nghe nhạc',
    description: 'Mở kho track, remix, nonstop, playlist và album.',
    icon: Headphones,
  },
  {
    href: '/nghe-si',
    label: 'Tìm nghệ sĩ',
    description: 'Khám phá hồ sơ nghệ sĩ và các tài năng nổi bật.',
    icon: Sparkles,
  },
]

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-page-orb error-page-orb-left" aria-hidden="true" />
      <div className="error-page-orb error-page-orb-right" aria-hidden="true" />

      <section className="container error-page-content">
        <div className="error-page-stage">
          <div className="error-page-code" aria-label="Lỗi 404">
            <span>4</span>
            <span className="error-page-vinyl" aria-hidden="true">
              <span className="error-page-vinyl-label">9L</span>
            </span>
            <span>4</span>
          </div>

          <p className="error-page-eyebrow">Trang này đã rời khỏi sân khấu</p>
          <h1>Chúng tôi chưa tìm thấy nội dung bạn cần.</h1>
          <p className="error-page-intro">
            Đường dẫn có thể đã thay đổi, nội dung đã được cập nhật hoặc địa chỉ chưa chính xác.
            Bạn có thể trở về trang chủ hoặc tiếp tục khám phá 9LIFE MAG.
          </p>

          <div className="error-page-actions">
            <Link href="/" className="button error-page-primary-action">
              <Home size={18} />
              Về trang chủ
            </Link>
            <Link href="/tim-kiem" className="button-secondary error-page-secondary-action">
              <Search size={18} />
              Tìm kiếm nội dung
            </Link>
          </div>
        </div>

        <div className="error-page-help">
          <div className="error-page-help-heading">
            <span>Bạn có thể tiếp tục tại đây</span>
            <small>Một vài điểm đến hữu ích</small>
          </div>
          <div className="error-page-link-grid">
            {helpfulLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="error-page-link-card">
                  <span className="error-page-link-icon"><Icon size={20} /></span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  <ArrowLeft className="error-page-link-arrow" size={18} />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
