import { ArtistPortalAccessTabs } from '@/components/artist-portal-access-tabs'
import { ArtistPortalLoginSlider } from '@/components/artist-portal-login-slider'

const portalFeatures = [{ title: 'Booking control', body: 'Theo dõi lead mới, lịch biểu diễn, trạng thái chốt show và yêu cầu kỹ thuật theo từng venue.' }, { title: 'Media management', body: 'Cập nhật link nhạc, SoundCloud, YouTube, Facebook video, rider và media kit.' }, { title: 'Content visibility', body: 'Quản lý bài viết, profile spotlight, gallery hình ảnh và CTA hiển thị ngoài frontend.' }]
const trustSignals = [{ label: 'Artist portal active', value: '120+' }, { label: 'Booking requests / tháng', value: '380+' }, { label: 'Media assets managed', value: '2.4K' }]

export default function ArtistAccountLoginPage() {
  return <main className="artist-portal-page"><section className="artist-portal-hero"><div className="container artist-portal-hero-grid"><div className="artist-portal-copy"><p className="section-eyebrow">Artist Login</p><h1>Portal riêng cho nghệ sĩ và manager</h1><p className="section-intro">Một cổng vận hành hồ sơ nghệ sĩ chuyên nghiệp: booking, music links, video, bài viết, lịch biểu diễn, rider và nhiều dữ liệu hiển thị khác.</p><div className="artist-portal-stats">{trustSignals.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div><ArtistPortalLoginSlider /></div>
    <div className="artist-portal-login-shell"><div className="artist-portal-login-card"><p className="section-eyebrow">Private Access</p><h2>Quản lý cổng nghệ sĩ</h2><p className="muted">Đăng nhập để quản lý profile hoặc gửi hồ sơ mới để team 9LIFE xét duyệt.</p><ArtistPortalAccessTabs /></div></div>
  </div></section><section className="section"><div className="container artist-portal-feature-grid">{portalFeatures.map((item) => <article key={item.title} className="artist-portal-feature-card"><p className="section-eyebrow">Portal feature</p><h3>{item.title}</h3><p className="muted">{item.body}</p></article>)}</div></section></main>
}
