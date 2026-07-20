import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/forgot-password-form'
import { PageHero } from '@/components/page-hero'

export default function ForgotPasswordPage() {
  return (
    <main className="account-hub-page">
      <PageHero
        eyebrow="Recovery"
        title="Khôi phục mật khẩu tài khoản"
        intro="Dùng chung cho cả user và nghệ sĩ. Bạn có thể gửi link khôi phục bằng email hoặc mở luồng reset trực tiếp trong giai đoạn thiết lập hệ thống."
      />

      <section className="section">
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </section>
    </main>
  )
}
