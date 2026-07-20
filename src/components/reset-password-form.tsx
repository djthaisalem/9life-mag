'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const accountType = searchParams.get('type') === 'artist' ? 'artist' : 'user'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const backHref = accountType === 'artist' ? '/tai-khoan/nghe-si' : '/tai-khoan'

  const handleSubmit = () => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
      }

      setMessage(result.message)
      setIsSuccess(result.ok)
    })
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="account-card">
        <div className="account-card-head">
          <div>
            <p className="section-eyebrow">Reset Password</p>
            <h2>Đặt lại mật khẩu mới</h2>
          </div>
          <span className="pill">{accountType === 'artist' ? 'Artist Portal' : 'User Account'}</span>
        </div>

        <p className="muted">
          Tạo mật khẩu mới để hoàn tất yêu cầu khôi phục. Link reset này chỉ dùng một lần.
        </p>

        <form className="form-shell account-login-form" action={handleSubmit}>
          <div className="field">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              id="newPassword"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ít nhất 8 ký tự"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <div className="account-form-actions">
            <button type="submit" className="button" disabled={isPending || !token}>
              {isPending ? 'Đang lưu...' : 'Xác nhận mật khẩu mới'}
            </button>
            <Link href={backHref} className="button-secondary">
              Quay lại đăng nhập
            </Link>
          </div>
        </form>

        {!token ? (
          <p className="muted" style={{ color: '#ffd0d0' }}>
            Thiếu mã reset password. Hãy mở lại đúng link được gửi từ hệ thống.
          </p>
        ) : null}

        {message ? (
          <p className="muted" style={{ color: isSuccess ? '#d7f6d5' : '#ffd0d0' }}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
