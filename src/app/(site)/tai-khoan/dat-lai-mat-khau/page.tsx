import { Suspense } from 'react'
import { PageHero } from '@/components/page-hero'
import { ResetPasswordForm } from '@/components/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <main className="account-hub-page">
      <PageHero
        eyebrow="Recovery"
        title="Đặt lại mật khẩu mới"
        intro="Liên kết này sẽ mở đúng khu tài khoản của bạn và hoàn tất bước xác nhận mật khẩu mới."
      />

      <section className="section">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  )
}
