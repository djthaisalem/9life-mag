'use client'

import { useState, useTransition } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type CmsAuthConfigFormProps = {
  initialValues: {
    googleClientId: string
    googleClientSecretPreview: string
    hasGoogleClientSecret: boolean
    facebookAppId: string
    facebookAppSecretPreview: string
    hasFacebookAppSecret: boolean
    resendApiKeyPreview: string
    hasResendApiKey: boolean
    resetPasswordFromEmail: string
    resetPasswordFromName: string
    isSocialConfigured: boolean
    isResetConfigured: boolean
  }
}

export function CmsAuthConfigForm({ initialValues }: CmsAuthConfigFormProps) {
  const capability = useCmsCapability('api_security')
  const [googleClientId, setGoogleClientId] = useState(initialValues.googleClientId)
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [facebookAppId, setFacebookAppId] = useState(initialValues.facebookAppId)
  const [facebookAppSecret, setFacebookAppSecret] = useState('')
  const [resendApiKey, setResendApiKey] = useState('')
  const [resetPasswordFromEmail, setResetPasswordFromEmail] = useState(initialValues.resetPasswordFromEmail)
  const [resetPasswordFromName, setResetPasswordFromName] = useState(initialValues.resetPasswordFromName)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(initialValues.isSocialConfigured || initialValues.isResetConfigured)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/auth-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(capability ? { Authorization: `Bearer ${capability}` } : {}),
        },
        body: JSON.stringify({
          googleClientId,
          googleClientSecret,
          facebookAppId,
          facebookAppSecret,
          resendApiKey,
          resetPasswordFromEmail,
          resetPasswordFromName,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
      }

      setMessage(result.message)
      setIsSuccess(result.ok)

      if (result.ok) {
        setGoogleClientSecret('')
        setFacebookAppSecret('')
        setResendApiKey('')
      }
    })
  }

  return (
    <div className="form-shell cms-embedded-form">
      <div className="cms-overview-stats cms-overview-stats-2">
        <article className="metric">
          <strong>{initialValues.isSocialConfigured ? 'Ready' : 'Pending'}</strong>
          <span>Google / Facebook login</span>
        </article>
        <article className="metric">
          <strong>{initialValues.isResetConfigured ? 'Ready' : 'Pending'}</strong>
          <span>Quên mật khẩu qua email</span>
        </article>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="googleClientId">Google Client ID</label>
          <input id="googleClientId" value={googleClientId} onChange={(event) => setGoogleClientId(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="googleClientSecret">Google Client Secret</label>
          <input
            id="googleClientSecret"
            type="password"
            value={googleClientSecret}
            onChange={(event) => setGoogleClientSecret(event.target.value)}
            placeholder={initialValues.hasGoogleClientSecret ? initialValues.googleClientSecretPreview || 'Đã lưu, để trống nếu giữ nguyên' : 'Nhập Google Client Secret'}
          />
        </div>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="facebookAppId">Facebook App ID</label>
          <input id="facebookAppId" value={facebookAppId} onChange={(event) => setFacebookAppId(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="facebookAppSecret">Facebook App Secret</label>
          <input
            id="facebookAppSecret"
            type="password"
            value={facebookAppSecret}
            onChange={(event) => setFacebookAppSecret(event.target.value)}
            placeholder={initialValues.hasFacebookAppSecret ? initialValues.facebookAppSecretPreview || 'Đã lưu, để trống nếu giữ nguyên' : 'Nhập Facebook App Secret'}
          />
        </div>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="resendApiKey">Resend API Key</label>
          <input
            id="resendApiKey"
            type="password"
            value={resendApiKey}
            onChange={(event) => setResendApiKey(event.target.value)}
            placeholder={initialValues.hasResendApiKey ? initialValues.resendApiKeyPreview || 'Đã lưu, để trống nếu giữ nguyên' : 're_...'}
          />
        </div>
        <div className="field">
          <label htmlFor="resetPasswordFromEmail">Email gửi reset</label>
          <input
            id="resetPasswordFromEmail"
            type="email"
            value={resetPasswordFromEmail}
            onChange={(event) => setResetPasswordFromEmail(event.target.value)}
            placeholder="no-reply@9lifemag.com"
          />
        </div>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="resetPasswordFromName">Tên hiển thị email</label>
          <input
            id="resetPasswordFromName"
            value={resetPasswordFromName}
            onChange={(event) => setResetPasswordFromName(event.target.value)}
            placeholder="9LIFE MAG"
          />
        </div>
        <div className="field">
          <label>Callback mặc định</label>
          <div className="field-note">
            Google: <code>/api/auth/social/google/callback</code>
            <br />
            Facebook: <code>/api/auth/social/facebook/callback</code>
          </div>
        </div>
      </div>

      <div className="cms-inline-actions">
        <button type="button" className="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu cấu hình đăng nhập'}
        </button>
      </div>

      {message ? (
        <p className="muted" style={{ color: isSuccess ? '#d7f6d5' : '#ffd0d0' }}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
