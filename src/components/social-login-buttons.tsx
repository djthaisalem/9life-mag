'use client'

import { useState } from 'react'

export function SocialLoginButtons() {
  const [pendingProvider, setPendingProvider] = useState<'google' | 'facebook' | null>(null)

  const startLogin = (provider: 'google' | 'facebook') => {
    setPendingProvider(provider)
    window.location.href = `/api/auth/social/${provider}`
  }

  return (
    <div id="social-login" className="social-login-grid">
      <button
        type="button"
        className="social-login-button social-login-google"
        onClick={() => startLogin('google')}
        disabled={pendingProvider !== null}
      >
        {pendingProvider === 'google' ? 'Đang chuyển sang Google...' : 'Tiếp tục với Google'}
      </button>
      <button
        type="button"
        className="social-login-button social-login-facebook"
        onClick={() => startLogin('facebook')}
        disabled={pendingProvider !== null}
      >
        {pendingProvider === 'facebook' ? 'Đang chuyển sang Facebook...' : 'Tiếp tục với Facebook'}
      </button>
    </div>
  )
}
