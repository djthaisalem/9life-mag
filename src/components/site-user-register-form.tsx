'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { registerUserAccount } from '@/lib/client-user-access'

export function SiteUserRegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    startTransition(async () => {
      const result = await registerUserAccount({ fullName, email, phone, password })

      if (!result.ok) {
        setMessage(result.message ?? 'Không thể tạo tài khoản lúc này.')
        return
      }

      router.push('/tai-khoan/dashboard')
      router.refresh()
    })
  }

  return (
    <form className="form-shell account-login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="registerFullName">Tên hiển thị (không bắt buộc)</label>
        <input
          id="registerFullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ví dụ: Minh Anh"
        />
      </div>
      <div className="field">
        <label htmlFor="registerEmail">Email</label>
        <input
          id="registerEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@domain.com"
        />
      </div>
      <div className="field">
        <label htmlFor="registerPhone">Số điện thoại</label>
        <input
          id="registerPhone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="090x xxx xxx"
        />
      </div>
      <div className="field">
        <label htmlFor="registerPassword">Mật khẩu</label>
        <input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ít nhất 8 ký tự"
          required
        />
      </div>

      <div className="account-form-actions">
        <button type="submit" className="button" disabled={isPending}>
          {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản user'}
        </button>
      </div>

      {message ? <p className="muted" style={{ color: '#ffd0d0' }}>{message}</p> : null}
      <p className="muted">
        Chỉ cần email hoặc số điện thoại chưa được đăng ký. Tài khoản user được duyệt ngay sau khi tạo.
      </p>
    </form>
  )
}
