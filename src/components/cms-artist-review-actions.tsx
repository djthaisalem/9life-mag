'use client'

import { useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

type CmsArtistReviewActionsProps = {
  artistId: string
  initialStatus: string
}

const statusLabel: Record<string, string> = {
  draft: 'Bản nháp',
  pending_review: 'Chờ duyệt',
  published: 'Đã duyệt và công khai',
  archived: 'Đã hủy',
}

export function CmsArtistReviewActions({ artistId, initialStatus }: CmsArtistReviewActionsProps) {
  const capability = useCmsCapability('artists')
  const [status, setStatus] = useState(initialStatus)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function update(profileStatus: 'published' | 'archived') {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/cms/artists/${artistId}/review`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({ profileStatus }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!result.ok) throw new Error(result.message || 'Khong the cap nhat ho so.')
      setStatus(profileStatus)
      setMessage(profileStatus === 'published' ? 'Da duyet va public.' : 'Da huy ho so va chuyen sang danh sach da huy.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khong the cap nhat ho so.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="cms-artist-review-actions">
    <span className="cms-status-chip">{statusLabel[status] ?? 'Bản nháp'}</span>
    {status !== 'published' && status !== 'archived' ? <><button type="button" className="button" disabled={busy} onClick={() => void update('published')}>Duyệt public</button><button type="button" className="button-secondary" disabled={busy} onClick={() => void update('archived')}>Hủy hồ sơ</button></> : null}
    {message ? <small>{message}</small> : null}
  </div>
}
