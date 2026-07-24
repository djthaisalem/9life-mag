import Link from 'next/link'
import { ArtistAgentPanel } from '@/components/artist-agent-panel'
import { PortalNotificationCenter } from '@/components/portal-notification-center'
import { DashboardLogoutButton } from '@/components/dashboard-logout-button'
import { StarAmount } from '@/components/star-amount'
import { requireArtistPortalAccess } from '@/lib/artist-portal-access'

const onboardingSteps = [
  { number: '01', title: 'Hoàn thiện hồ sơ', description: 'Thêm tên nghệ sĩ, vai trò, ảnh đại diện, ảnh cover và phần giới thiệu ngắn để tạo trang profile chỉn chu.', href: '/tai-khoan/nghe-si/dashboard/profile', action: 'Thiết lập hồ sơ' },
  { number: '02', title: 'Hoàn thiện thông tin nhận show', description: 'Khai báo khu vực nhận show, mức giá hoặc lựa chọn liên hệ, đầu mối phản hồi và rider trong hồ sơ.', href: '/tai-khoan/nghe-si/dashboard/profile', action: 'Hoàn thiện hồ sơ', featured: true },
  { number: '03', title: 'Thêm nhạc và media', description: 'Cập nhật link nhạc, video, ảnh và media kit để đối tác có đủ tư liệu trước khi liên hệ.', href: '/tai-khoan/nghe-si/dashboard/music', action: 'Thêm nội dung' },
  { number: '04', title: 'Xem trước và gửi duyệt', description: 'Kiểm tra lại thông tin hiển thị công khai. Hồ sơ chỉ xuất hiện trên site sau khi được quản trị viên duyệt.', href: '/nghe-si/neon-viper', action: 'Xem bản xem trước' },
]

const bookingChecklist = [
  'Xem yêu cầu mới theo trạng thái đang tiếp nhận, đã tiếp nhận hoặc hủy.',
  'Kiểm tra venue, lịch biểu diễn, ngân sách và giờ soundcheck.',
  'Theo dõi lịch sử đặt bàn được tạo từ tài khoản nghệ sĩ.',
  'Chuẩn bị rider, check-in và đầu mối liên hệ trước show.',
]

const workspaceLinks = [
  { title: 'Hồ sơ nghệ sĩ', description: 'Thông tin công khai, hình ảnh và định vị cá nhân.', href: '/tai-khoan/nghe-si/dashboard/profile' },
  { title: 'Nhạc và playlist', description: 'Link phát, bài nhạc, nonstop và playlist.', href: '/tai-khoan/nghe-si/dashboard/music' },
  { title: 'Video và media kit', description: 'Video embed, gallery, logo và press assets.', href: '/tai-khoan/nghe-si/dashboard/media' },
  { title: 'Nội dung biên tập', description: 'Bài viết, spotlight và nội dung truyền thông.', href: '/tai-khoan/nghe-si/dashboard/content' },
]

const artistPerformance = [
  { title: 'Water Lily Club Remix', type: 'Remix', plays: '11.2K', downloads: '4,218', votes: '126', stars: '4,344' },
  { title: 'Rooftop Pulse', type: 'Nonstop', plays: '6.1K', downloads: '—', votes: '74', stars: '2,098' },
  { title: 'Electric Bloom', type: 'Album', plays: '7.5K', downloads: '1,086', votes: '86', stars: '2,452' },
]

export default async function ArtistDashboardPage() {
  const account = await requireArtistPortalAccess('artist')
  const identity = account.email || account.phone || 'tài khoản nghệ sĩ'
  const hasPublishedProfile = Boolean(account.artistProfileSlug)
  const profileRewardClaimed = (account.signupStarsEarned ?? 0) >= 300
  const performance = hasPublishedProfile ? artistPerformance : []

  return (
    <main className="artist-dashboard-page">
      <section className="artist-dashboard-hero">
        <div className="container artist-dashboard-hero-row">
          <div>
            <p className="section-eyebrow">Artist Workspace</p>
            <h1>Chào {account.fullName}</h1>
            <p className="section-intro">Đăng ký thành công với {identity}. Hãy hoàn thiện hồ sơ đầu tiên để sẵn sàng nhận booking và gửi duyệt hiển thị trên 9LIFE MAG.</p>
          </div>
          <div className="artist-dashboard-hero-actions">
            <PortalNotificationCenter />
            <Link href="/tai-khoan/nghe-si/dashboard/booking" className="button">Theo dõi Booking</Link>
            <Link href="/tai-khoan/nghe-si/dashboard/profile" className="button-secondary">Chỉnh sửa hồ sơ</Link>
            <DashboardLogoutButton accountType="artist" />
          </div>
        </div>
      </section>

      <section className="section artist-dashboard-analytics-section">
        {!hasPublishedProfile ? <div className="container"><article className="artist-dashboard-panel artist-profile-rewards"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Đăng ký thành công</p><h2>Hồ sơ của bạn đang chờ cập nhật</h2><p className="artist-editor-panel-note">Bạn chưa có profile công khai. Bắt đầu bằng tên nghệ sĩ, headline, bio ngắn và vai trò chính. Sau lần lưu hoàn chỉnh đầu tiên, hệ thống cộng +300 sao vào ví.</p></div><Link href="/tai-khoan/nghe-si/dashboard/profile" className="button">Cập nhật hồ sơ</Link></div></article></div> : null}
        <div className="container artist-dashboard-stats artist-dashboard-stats-4">
          <article className="artist-dashboard-stat"><strong><StarAmount amount={account.stars} /></strong><span>Sao hiện có</span></article>
          <article className="artist-dashboard-stat"><strong>{hasPublishedProfile ? '—' : '0'}</strong><span>Lượt vote nhận được</span></article>
          <article className="artist-dashboard-stat"><strong>{hasPublishedProfile ? '—' : '0'}</strong><span>Lượt nghe nội dung</span></article>
          <article className="artist-dashboard-stat"><strong>{hasPublishedProfile ? '—' : '0'}</strong><span>Lượt tải xuống</span></article>
        </div>
        <div className="container artist-dashboard-star-disclaimer">
          <em>Sao là đơn vị điểm nội bộ được phát hành để thử nghiệm và vận hành các tính năng cộng đồng của 9life Mag. Sao không phải tiền tệ, không có giá trị quy đổi thành tiền mặt, không được mua bán hoặc chuyển nhượng ngoài phạm vi hệ thống và có thể được điều chỉnh theo chính sách vận hành.</em>
        </div>
        <div className="container">
          <article className="artist-dashboard-panel artist-profile-rewards">
            <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Profile rewards</p><h2>Thưởng sao khi hoàn thiện hồ sơ</h2><p className="artist-editor-panel-note">Lần lưu hoàn chỉnh đầu tiên của hồ sơ cơ bản nhận 300 sao. Các phần mở rộng sẽ được áp dụng theo chính sách vận hành sau.</p></div><strong className="artist-profile-reward-total">{profileRewardClaimed ? 'Đã nhận' : <StarAmount amount={300} />}</strong></div>
            <div className="artist-dashboard-update-list">
              <div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p><strong>{profileRewardClaimed ? 'Đã cộng thưởng hồ sơ' : 'Hoàn thiện hồ sơ cơ bản'}</strong> · {profileRewardClaimed ? 'Phần thưởng +300 sao đã được ghi nhận trong ví.' : 'Điền tên nghệ sĩ, headline, bio ngắn và vai trò chính rồi bấm lưu để nhận +300 sao.'}</p></div>
              <div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Ảnh portrait, cover, giới thiệu, kinh nghiệm làm việc, gallery từ 4 ảnh, media và booking contact: mỗi mục hoàn thiện nhận +10 sao.</p></div>
            </div>
          </article>
        </div>
        <div className="container">
          <article className="artist-dashboard-panel artist-dashboard-performance">
            <div className="artist-dashboard-panel-head">
              <div>
                <p className="section-eyebrow">Music performance</p>
                <h2>Hiệu suất nhạc đã đăng</h2>
                <p className="artist-editor-panel-note">Theo dõi lượt nghe, tải xuống, vote và số sao đã được sử dụng trên từng nội dung thuộc hồ sơ nghệ sĩ.</p>
              </div>
              <Link href="/tai-khoan/nghe-si/dashboard/music" className="button-secondary">Quản lý nhạc</Link>
            </div>
            <div className="artist-dashboard-performance-table" role="table" aria-label="Hiệu suất nhạc đã đăng">
              <div className="artist-dashboard-performance-row artist-dashboard-performance-head" role="row">
                <span>Nội dung</span><span>Lượt nghe</span><span>Tải xuống</span><span>Vote</span><span>Sao sử dụng</span>
              </div>
              {performance.map((item) => (
                <div key={item.title} className="artist-dashboard-performance-row" role="row">
                  <strong data-label="Nội dung"><small>{item.type}</small>{item.title}</strong><span data-label="Lượt nghe">{item.plays}</span><span data-label="Tải xuống">{item.downloads}</span><span data-label="Vote">{item.votes}</span><b data-label="Sao sử dụng"><StarAmount amount={item.stars} /></b>
                </div>
              ))}
              {!performance.length ? <div className="artist-dashboard-performance-row" role="row"><strong>Chưa có nội dung phát hành</strong><span>0</span><span>0</span><span>0</span><b>0</b></div> : null}
            </div>
          </article>
        </div>
      </section>

      <section className="section artist-onboarding-section">
        <div className="container">
          <div className="artist-dashboard-panel-head">
            <div>
              <p className="section-eyebrow">First-time setup</p>
              <h2>4 bước để hồ sơ sẵn sàng</h2>
            </div>
            <span className="artist-editor-static-note">Bạn có thể hoàn thành theo thứ tự này</span>
          </div>
          <div className="artist-onboarding-grid">
            {onboardingSteps.map((step) => (
              <article key={step.number} className={`artist-onboarding-card${step.featured ? ' artist-onboarding-card-featured' : ''}`}>
                <span>{step.number}</span>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
                <Link href={step.href} className="artist-dashboard-module-link">{step.action}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container artist-dashboard-main">
          <div className="artist-dashboard-column">
            <article className="artist-dashboard-panel artist-booking-ready-card">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Booking readiness</p>
                  <h2>Theo dõi Booking tập trung</h2>
                  <p className="artist-editor-panel-note">Thông tin nhận show được quản lý trong hồ sơ. Tại đây bạn chỉ theo dõi yêu cầu Booking, lịch đặt bàn và các mốc chuẩn bị cho show.</p>
                </div>
                <Link href="/tai-khoan/nghe-si/dashboard/booking" className="button">Mở Booking</Link>
              </div>
              <div className="artist-booking-checklist">
                {bookingChecklist.map((item, index) => (
                  <div key={item}><span>{index + 1}</span><p>{item}</p></div>
                ))}
              </div>
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Artist workspace</p><h2>Các khu vực quản lý</h2></div></div>
              <div className="artist-dashboard-module-grid">
                {workspaceLinks.map((item) => (
                  <article key={item.title} className="artist-dashboard-module-card">
                    <strong>{item.title}</strong><p>{item.description}</p>
                    <Link href={item.href} className="artist-dashboard-module-link">Mở quản lý</Link>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="artist-dashboard-side">
            <ArtistAgentPanel />
            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Before publishing</p><h2>Trước khi gửi duyệt</h2></div></div>
              <div className="artist-dashboard-update-list">
                <div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Kiểm tra ảnh portrait và ảnh cover hiển thị đúng tỷ lệ.</p></div>
                <div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Đảm bảo Booking có ít nhất một đầu mối liên hệ và khu vực nhận show.</p></div>
                <div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Thêm một link nhạc hoặc video để profile có nội dung nghe thử.</p></div>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  )
}
