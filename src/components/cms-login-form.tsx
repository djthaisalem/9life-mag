'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export function CmsLoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/cms/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [role, setRole] = useState('Super Admin')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/session/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          otpCode,
          role,
          next: nextPath,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
        redirectTo?: string
      }

      if (result.ok && result.redirectTo) {
        window.location.href = result.redirectTo
        return
      }

      setMessage(result.message)
    })
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="cmsEmail">Email quản trị</label>
        <input
          id="cmsEmail"
          name="cmsEmail"
          type="email"
          placeholder="admin@9lifemag.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="cmsPassword">Mật khẩu</label>
        <input
          id="cmsPassword"
          name="cmsPassword"
          type="password"
          placeholder="Nhập mật khẩu mạnh"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="cmsOtp">Mã xác minh / 2FA</label>
        <input
          id="cmsOtp"
          name="cmsOtp"
          placeholder="6 chữ số hoặc mã từ ứng dụng xác thực"
          value={otpCode}
          onChange={(event) => setOtpCode(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="cmsRole">Vai trò dự kiến</label>
        <select id="cmsRole" name="cmsRole" value={role} onChange={(event) => setRole(event.target.value)}>
          <option>Super Admin</option>
          <option>Editor</option>
          <option>Artist Ops</option>
          <option>Music Ops</option>
          <option>Finance Ops</option>
        </select>
      </div>
      <div className="cms-login-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? 'Đang xác thực...' : 'Đăng nhập CMS'}
        </button>
      </div>

      {message ? <p className="muted" style={{ color: '#ffd0d0' }}>{message}</p> : null}
    </form>
  )
}
