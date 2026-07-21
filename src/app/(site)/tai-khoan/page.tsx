'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PageHero } from '@/components/page-hero'
import { SiteUserAccountTabs } from '@/components/site-user-account-tabs'

const userBenefits = [
  'Lưu lịch sử đặt bàn, booking và các yêu cầu đã gửi.',
  'Theo dõi playlist, remix đã tải và quyền truy cập nội dung.',
  'Nhận ưu đãi theo venue, nghệ sĩ và đêm diễn yêu thích.',
]

const userShortcuts = [
  { label: 'Đơn hàng / download', value: '08' },
  { label: 'Yêu cầu đang xử lý', value: '03' },
  { label: 'Venue đã theo dõi', value: '12' },
]

const artistCapabilities = [
  'Quản lý hồ sơ nghệ sĩ, thương hiệu và ghi chú booking.',
  'Cập nhật link nhạc, video, social, media kit và rider.',
  'Theo dõi booking mới, lịch biểu diễn, bài viết và dữ liệu hiển thị.',
]

export default function AccountPage() {
  const [activePortal, setActivePortal] = useState<'user' | 'artist'>('user')

  return (
    <main className="account-hub-page">
      <PageHero
        eyebrow="Account Access"
        title="Tài khoản dành cho cộng đồng và nghệ sĩ"
        intro="User theo dõi hoạt động cá nhân trên nền tảng. Nghệ sĩ có cổng riêng để quản lý hồ sơ, nội dung và booking."
      />

      <section className="section">
        <div className="container">
          <div className="account-mobile-portal-tabs" role="tablist" aria-label="Chọn loại tài khoản">
            <button
              type="button"
              className={`account-mobile-portal-tab ${activePortal === 'user' ? 'account-mobile-portal-tab-active' : ''}`}
              role="tab"
              aria-selected={activePortal === 'user'}
              onClick={() => setActivePortal('user')}
            >
              User
            </button>
            <button
              type="button"
              className={`account-mobile-portal-tab ${activePortal === 'artist' ? 'account-mobile-portal-tab-active' : ''}`}
              role="tab"
              aria-selected={activePortal === 'artist'}
              onClick={() => setActivePortal('artist')}
            >
              Artist
            </button>
          </div>

          <div className="account-hub-grid">
            <article className={`account-card account-card-user ${activePortal === 'user' ? '' : 'account-card-mobile-hidden'}`}>
              <div className="account-card-head">
                <div>
                  <p className="section-eyebrow">User Account</p>
                  <h2>Tài khoản người dùng</h2>
                </div>
                <span className="pill">Audience / Member</span>
              </div>

              <SiteUserAccountTabs />

              <div className="account-benefit-list">
                {userBenefits.map((item) => (
                  <div key={item} className="account-benefit-item">
                    <span className="account-benefit-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="account-mini-metrics">
                {userShortcuts.map((item) => (
                  <article key={item.label} className="metric">
                    <strong>{item.value}</strong>
                    <span className="muted">{item.label}</span>
                  </article>
                ))}
              </div>

              <div className="artist-portal-actions">
                <Link href="/tai-khoan/dashboard" className="button-secondary">Xem dashboard user mẫu</Link>
              </div>
            </article>

            <article className={`account-card account-card-artist ${activePortal === 'artist' ? '' : 'account-card-mobile-hidden'}`}>
              <div className="account-card-head">
                <div>
                  <p className="section-eyebrow">Artist Portal</p>
                  <h2>Đăng nhập nghệ sĩ</h2>
                </div>
                <span className="pill">Artist / Manager</span>
              </div>

              <p className="muted">Khu vực riêng cho nghệ sĩ, manager và booking coordinator để vận hành hồ sơ, nội dung và lịch biểu diễn.</p>
              <div className="artist-portal-preview">
                <div className="artist-portal-visual">
                  <span className="artist-portal-badge">Private access</span>
                  <strong>Artist Login + Dashboard</strong>
                  <p>Quản lý profile, music links, video embeds, bài viết, booking funnel, media kit và lịch biểu diễn.</p>
                </div>
                <div className="artist-portal-actions">
                  <Link href="/tai-khoan/nghe-si" className="button">Mở cổng nghệ sĩ</Link>
                  <Link href="/tai-khoan/nghe-si/dashboard" className="button-secondary">Xem dashboard mẫu</Link>
                </div>
              </div>

              <div className="account-benefit-list">
                {artistCapabilities.map((item) => (
                  <div key={item} className="account-benefit-item">
                    <span className="account-benefit-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
