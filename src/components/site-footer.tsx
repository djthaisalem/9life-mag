import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="muted">
            Nền tảng nội dung, music và booking dành cho cộng đồng nightlife, nghệ sĩ biểu diễn và các venue giải trí hiện đại.
          </p>
          <p className="footer-domain">9lifemag.com</p>
          <img src="/footer-9life-stage.png" alt="9LIFE MAG stage visual" className="footer-feature-image" />
        </div>

        <div className="footer-link-columns">
          <div className="footer-column">
            <h3>Khám phá</h3>
            <p><Link href="/">Trang chủ</Link></p>
            <p><Link href="/tin-tuc">Tin tức</Link></p>
            <p><Link href="/nghe-si">Nghệ sĩ</Link></p>
            <p><Link href="/music">Music</Link></p>
            <p><Link href="/dat-ban">Đặt bàn</Link></p>
            <p><Link href="/booking">Booking</Link></p>
            <p><Link href="/tai-khoan">Tài khoản</Link></p>
          </div>

          <div className="footer-column">
            <h3>Pháp lý</h3>
            <p><Link href="/phap-ly/tuyen-bo-ban-quyen">Tuyên bố bản quyền</Link></p>
            <p><Link href="/phap-ly/chinh-sach-noi-dung">Chính sách nội dung</Link></p>
            <p><Link href="/phap-ly/chinh-sach-quyen-rieng-tu">Chính sách quyền riêng tư</Link></p>
            <p><Link href="/phap-ly/mien-tru-trach-nhiem">Miễn trừ trách nhiệm</Link></p>
            <p className="footer-dashboard-link"><Link href="/cms">Dashboard</Link></p>
          </div>

          <div className="footer-column">
            <h3>Liên hệ</h3>
            <p>booking@9lifemag.com</p>
            <p>support@9lifemag.com</p>
            <p>TP.HCM / Hà Nội / Đà Nẵng</p>
            <p className="footer-note">
              Một số nội dung media, profile nghệ sĩ và dữ liệu âm nhạc có thể thay đổi theo chiến dịch, phạm vi cấp phép hoặc lịch vận hành thực tế.
            </p>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 9LIFE MAG. All rights reserved.</p>
        <p>Nội dung trên website mang tính thông tin, biên tập và hỗ trợ vận hành nền tảng.</p>
      </div>
    </footer>
  )
}
