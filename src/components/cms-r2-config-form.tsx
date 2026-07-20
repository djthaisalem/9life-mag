'use client'

import { useState, useTransition } from 'react'

type CmsR2ConfigFormProps = {
  initialValues: {
    accountId: string
    bucket: string
    endpoint: string
    publicBaseUrl: string
    accessKeyPreview: string
    hasSecretAccessKey: boolean
    isConfigured: boolean
  }
}

export function CmsR2ConfigForm({ initialValues }: CmsR2ConfigFormProps) {
  const [accountId, setAccountId] = useState(initialValues.accountId)
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [bucket, setBucket] = useState(initialValues.bucket)
  const [endpoint, setEndpoint] = useState(initialValues.endpoint)
  const [publicBaseUrl, setPublicBaseUrl] = useState(initialValues.publicBaseUrl)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(initialValues.isConfigured)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/r2-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          accessKeyId,
          secretAccessKey,
          bucket,
          endpoint,
          publicBaseUrl,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message: string
      }

      setMessage(result.message)
      setIsSuccess(result.ok)

      if (result.ok) {
        setAccessKeyId('')
        setSecretAccessKey('')
      }
    })
  }

  return (
    <div className="form-shell cms-embedded-form">
      <div className="cms-overview-stats cms-overview-stats-2">
        <article className="metric">
          <strong>{initialValues.isConfigured ? 'Ready' : 'Pending'}</strong>
          <span>Trạng thái kết nối R2</span>
        </article>
        <article className="metric">
          <strong>{initialValues.bucket || 'Chưa có'}</strong>
          <span>Bucket hiện tại</span>
        </article>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="r2AccountId">Cloudflare Account ID</label>
          <input id="r2AccountId" value={accountId} onChange={(event) => setAccountId(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r2Bucket">Tên bucket</label>
          <input id="r2Bucket" value={bucket} onChange={(event) => setBucket(event.target.value)} />
        </div>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="r2AccessKey">Access Key ID</label>
          <input
            id="r2AccessKey"
            value={accessKeyId}
            onChange={(event) => setAccessKeyId(event.target.value)}
            placeholder={initialValues.accessKeyPreview || 'Nhập Access Key ID'}
          />
        </div>
        <div className="field">
          <label htmlFor="r2SecretKey">Secret Access Key</label>
          <input
            id="r2SecretKey"
            type="password"
            value={secretAccessKey}
            onChange={(event) => setSecretAccessKey(event.target.value)}
            placeholder={initialValues.hasSecretAccessKey ? 'Đã lưu, để trống nếu giữ nguyên' : 'Nhập Secret Access Key'}
          />
        </div>
      </div>

      <div className="cms-form-two">
        <div className="field">
          <label htmlFor="r2Endpoint">R2 Endpoint</label>
          <input
            id="r2Endpoint"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="https://<account-id>.r2.cloudflarestorage.com"
          />
        </div>
        <div className="field">
          <label htmlFor="r2PublicBaseUrl">Public base URL / custom domain</label>
          <input
            id="r2PublicBaseUrl"
            value={publicBaseUrl}
            onChange={(event) => setPublicBaseUrl(event.target.value)}
            placeholder="https://cdn.9lifemag.com"
          />
        </div>
      </div>

      <div className="cms-inline-actions">
        <button type="button" className="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Đang lưu...' : 'Lưu cấu hình R2'}
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
