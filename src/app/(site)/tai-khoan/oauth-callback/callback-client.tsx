'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function OAuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (!error) {
      router.replace('/tai-khoan/dashboard')
    }
  }, [error, router])

  if (error) {
    return (
      <div className="account-card account-card-user">
        <div className="account-card-head">
          <div>
            <p className="section-eyebrow">Social Login</p>
            <h2>Không thể hoàn tất đăng nhập</h2>
          </div>
        </div>
        <p className="muted">
          Mã lỗi: <strong>{error}</strong>
        </p>
        <p className="muted">Hãy kiểm tra lại phần cấu hình Google / Facebook rồi thử lại.</p>
      </div>
    )
  }

  return (
    <div className="account-card account-card-user">
      <div className="account-card-head">
        <div>
          <p className="section-eyebrow">Social Login</p>
          <h2>Đang hoàn tất đăng nhập</h2>
        </div>
      </div>
      <p className="muted">Hệ thống đang xác nhận phiên đăng nhập và chuyển bạn vào dashboard.</p>
    </div>
  )
}
