'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

type DeliveryMethod = 'email' | 'telegram'

export function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') === 'artist' ? 'artist' : 'user'
  const [accountType, setAccountType] = useState<'user' | 'artist'>(initialType)
  const [method, setMethod] = useState<DeliveryMethod>('email')
  const [identity, setIdentity] = useState('')
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [telegramUrl, setTelegramUrl] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const backHref = useMemo(
    () => (accountType === 'artist' ? '/tai-khoan/nghe-si' : '/tai-khoan'),
    [accountType]
  )
  const otpHref = `/tai-khoan/dat-lai-mat-khau?type=${accountType}&mode=otp`

  const handleSubmit = () => {
    setMessage('')
    setPreviewUrl('')
    setRecoveryCode('')
    setTelegramUrl('')

    startTransition(async () => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, accountType, method }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
        previewUrl?: string
        recoveryCode?: string
        telegramUrl?: string
      }

      setMessage(result.message)
      setPreviewUrl(result.previewUrl ?? '')
      setRecoveryCode(result.recoveryCode ?? '')
      setTelegramUrl(result.telegramUrl ?? '')
      setIsSuccess(result.ok)
    })
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="account-card">
        <div className="account-card-head">
          <div>
            <p className="section-eyebrow">Password Reset</p>
            <h2>Khôi phục mật khẩu</h2>
          </div>
          <span className="pill">{accountType === 'artist' ? 'Artist Portal' : 'User Account'}</span>
        </div>

        <p className="muted">
          Chọn nhận OTP và link qua email, hoặc tạo mã để xác minh với bot Telegram 9LIFE. Mọi mã khôi phục có hiệu lực 24 giờ và chỉ dùng một lần.
        </p>

        <form className="form-shell account-login-form" action={handleSubmit}>
          <div className="cms-inline-actions">
            <button
              type="button"
              className={accountType === 'user' ? 'button' : 'button-secondary'}
              onClick={() => setAccountType('user')}
            >
              User
            </button>
            <button
              type="button"
              className={accountType === 'artist' ? 'button' : 'button-secondary'}
              onClick={() => setAccountType('artist')}
            >
              Nghệ sĩ
            </button>
          </div>

          <div className="cms-inline-actions">
            <button
              type="button"
              className={method === 'email' ? 'button' : 'button-secondary'}
              onClick={() => setMethod('email')}
            >
              Nhận qua email
            </button>
            <button
              type="button"
              className={method === 'telegram' ? 'button' : 'button-secondary'}
              onClick={() => setMethod('telegram')}
            >
              Xác minh qua Telegram
            </button>
          </div>

          <div className="field">
            <label htmlFor="resetIdentity">Email hoặc số điện thoại đã đăng ký</label>
            <input
              id="resetIdentity"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder="email@domain.com hoặc 090x xxx xxx"
              required
            />
          </div>

          <div className="account-form-actions">
            <button type="submit" className="button" disabled={isPending}>
              {isPending
                ? 'Đang xử lý...'
                : method === 'email'
                  ? 'Gửi OTP và link'
                  : 'Tạo mã Telegram'}
            </button>
            <Link href={backHref} className="button-secondary">
              Quay lại đăng nhập
            </Link>
          </div>
        </form>

        {message ? (
          <div className="account-benefit-list" style={{ marginTop: 20 }}>
            <div className="account-benefit-item">
              <span className="account-benefit-dot" />
              <span style={{ color: isSuccess ? '#f6e7b2' : '#ffd0d0' }}>{message}</span>
            </div>

            {recoveryCode ? (
              <div className="account-benefit-item">
                <span className="account-benefit-dot" />
                <span>
                  Mã Telegram: <strong style={{ letterSpacing: 2 }}>{recoveryCode}</strong>
                </span>
              </div>
            ) : null}

            <div className="artist-portal-actions">
              {method === 'email' ? (
                <Link href={otpHref} className="button-secondary">
                  Tôi đã nhận OTP
                </Link>
              ) : null}
              {telegramUrl ? (
                <a href={telegramUrl} className="button-secondary" target="_blank" rel="noreferrer">
                  Mở bot Telegram
                </a>
              ) : null}
              {previewUrl ? (
                <Link href={previewUrl} className="button-secondary">
                  Mở link reset để kiểm thử
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
