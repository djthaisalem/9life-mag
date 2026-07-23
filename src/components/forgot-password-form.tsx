'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

export function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') === 'artist' ? 'artist' : 'user'
  const [accountType, setAccountType] = useState<'user' | 'artist'>(initialType)
  const [identity, setIdentity] = useState('')
  const [message, setMessage] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [telegramUrl, setTelegramUrl] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const backHref = useMemo(
    () => (accountType === 'artist' ? '/tai-khoan/nghe-si' : '/tai-khoan'),
    [accountType],
  )

  const handleSubmit = () => {
    setMessage('')
    setRecoveryCode('')
    setTelegramUrl('')

    startTransition(async () => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, accountType }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
        recoveryCode?: string
        telegramUrl?: string
      }

      setMessage(result.message)
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
            <h2>Khôi phục mật khẩu qua Telegram</h2>
          </div>
          <span className="pill">{accountType === 'artist' ? 'Artist Portal' : 'User Account'}</span>
        </div>

        <p className="muted">
          Hệ thống sẽ tạo một mã xác minh có hiệu lực 24 giờ. Gửi mã này cho bot Telegram
          9LIFE để nhận link đặt lại mật khẩu. Mỗi mã chỉ dùng được một lần; mã mới sẽ thay
          thế mã đã tạo trước đó.
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
              {isPending ? 'Đang tạo mã...' : 'Tạo mã Telegram'}
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

            {telegramUrl ? (
              <div className="artist-portal-actions">
                <a href={telegramUrl} className="button" target="_blank" rel="noreferrer">
                  Mở bot Telegram
                </a>
              </div>
            ) : (
              <p className="muted">
                Bot chưa có đường dẫn công khai. Hãy mở bot Telegram 9LIFE và gửi mã theo
                mẫu: RESET XXXX-XXXX-XXXX-XXXX.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
