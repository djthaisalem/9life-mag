'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SocialLoginButtons } from '@/components/social-login-buttons'
import { loginDemoUser } from '@/lib/client-user-access'

export function SiteUserLoginForm() {
  const router = useRouter()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    startTransition(async () => {
      const result = await loginDemoUser(identity, password)

      if (!result.ok) {
        setMessage(result.message ?? 'Không thể đăng nhập lúc này.')
        return
      }

      router.push('/tai-khoan/dashboard')
      router.refresh()
    })
  }

  return (
    <form className="form-shell account-login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="userIdentity">Email hoặc số điện thoại</label>
        <input
          id="userIdentity"
          name="userIdentity"
          value={identity}
          onChange={(event) => setIdentity(event.target.value)}
          placeholder="email@domain.com hoặc 090x xxx xxx"
        />
      </div>
      <div className="field">
        <label htmlFor="userPassword">Mật khẩu</label>
        <input
          id="userPassword"
          name="userPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu của bạn"
        />
      </div>
      <div className="account-form-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? 'Đang đăng nhập...' : 'Đăng nhập user'}
        </button>
        <a href="/tai-khoan/quen-mat-khau?type=user" className="button-secondary">
          Quên mật khẩu
        </a>
      </div>

      {message ? <p className="muted" style={{ color: '#ffd0d0' }}>{message}</p> : null}

      <SocialLoginButtons />
    </form>
  )
}
