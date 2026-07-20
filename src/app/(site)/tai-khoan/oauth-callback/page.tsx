import { Suspense } from 'react'
import { PageHero } from '@/components/page-hero'
import { OAuthCallbackClient } from './callback-client'

export default function OAuthCallbackPage() {
  return (
    <main className="account-hub-page">
      <PageHero
        eyebrow="Social Login"
        title="Đăng nhập bằng nền tảng ngoài"
        intro="Hệ thống đang hoàn tất xác thực và đồng bộ tài khoản người dùng vào trải nghiệm của 9LIFE MAG."
      />

      <section className="section">
        <div className="container">
          <Suspense fallback={null}>
            <OAuthCallbackClient />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
