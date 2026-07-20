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
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const backHref = useMemo(() => (accountType === 'artist' ? '/tai-khoan/nghe-si' : '/tai-khoan'), [accountType])

  const handleSubmit = () => {
    setMessage('')
    setPreviewUrl('')

    startTransition(async () => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity,
          accountType,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
        previewUrl?: string
      }

      setMessage(result.message)
      setPreviewUrl(result.previewUrl ?? '')
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
          Nhập email hoặc số điện thoại đã dùng để đăng ký. Nếu email reset đã được cấu hình, hệ thống sẽ gửi
          link đặt lại mật khẩu cho bạn.
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
            <label htmlFor="resetIdentity">Email hoặc số điện thoại</label>
            <input
              id="resetIdentity"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder="email@domain.com hoặc 090x xxx xxx"
            />
          </div>

          <div className="account-form-actions">
            <button type="submit" className="button" disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Gửi link khôi phục'}
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
            {previewUrl ? (
              <div className="artist-portal-actions">
                <Link href={previewUrl} className="button-secondary">
                  Mở link reset để kiểm thử
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
