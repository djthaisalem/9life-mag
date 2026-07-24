'use client'

import { useState, useTransition } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'
import type { CmsSiteAccount } from '@/lib/site-user-session'

export function CmsUserEditor({ initialUser }: { initialUser: CmsSiteAccount }) {
  const capability = useCmsCapability('api_security')
  const [user, setUser] = useState(initialUser)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(true)
  const [isPending, startTransition] = useTransition()

  const saveUser = () => {
    setMessage('')
    startTransition(async () => {
      const response = await fetch(`/api/cms/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          stars: user.stars,
          isPremium: user.isPremium,
          isActive: user.isActive,
        }),
      })
      const result = (await response.json()) as {
        ok: boolean
        message?: string
        account?: CmsSiteAccount
      }

      setIsSuccess(result.ok)
      setMessage(result.message ?? 'Không thể lưu tài khoản.')
      if (result.account) setUser(result.account)
    })
  }

  return (
    <div className="form-shell cms-embedded-form">
      <div className="field">
        <label htmlFor="cmsUserName">Tên hiển thị</label>
        <input
          id="cmsUserName"
          value={user.name}
          onChange={(event) => setUser((current) => ({ ...current, name: event.target.value }))}
        />
      </div>
      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="cmsUserEmail">Email</label>
          <input
            id="cmsUserEmail"
            type="email"
            value={user.email}
            onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="cmsUserPhone">Số điện thoại</label>
          <input
            id="cmsUserPhone"
            value={user.phone}
            onChange={(event) => setUser((current) => ({ ...current, phone: event.target.value }))}
          />
        </div>
      </div>
      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="cmsUserStars">Số sao hiện tại</label>
          <input
            id="cmsUserStars"
            type="number"
            min="0"
            value={user.stars}
            onChange={(event) =>
              setUser((current) => ({ ...current, stars: Number(event.target.value) || 0 }))
            }
          />
        </div>
        <div className="field">
          <label>Loại tài khoản</label>
          <input value={user.accountType === 'artist' ? 'Artist portal' : 'User'} readOnly />
        </div>
      </div>
      <div className="cms-form-two">
        <label className="cms-checkbox-row">
          <input
            type="checkbox"
            checked={user.isActive}
            onChange={(event) =>
              setUser((current) => ({ ...current, isActive: event.target.checked }))
            }
          />
          <span>Cho phép tài khoản hoạt động</span>
        </label>
        <label className="cms-checkbox-row">
          <input
            type="checkbox"
            checked={user.isPremium}
            onChange={(event) =>
              setUser((current) => ({ ...current, isPremium: event.target.checked }))
            }
          />
          <span>Kích hoạt gói Premium</span>
        </label>
      </div>
      <div className="cms-inline-actions">
        <button type="button" className="button" onClick={saveUser} disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
      {message ? (
        <p className={isSuccess ? 'cms-form-feedback cms-form-feedback-success' : 'cms-form-feedback'}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
