'use client'

import { useState } from 'react'

type CmsArtistReviewActionsProps = {
  artistId: string
  initialStatus: string
}

export function CmsArtistReviewActions({ artistId, initialStatus }: CmsArtistReviewActionsProps) {
  const [status, setStatus] = useState(initialStatus)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function update(profileStatus: 'published' | 'draft') {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/cms/artists/${artistId}/review`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileStatus }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!result.ok) throw new Error(result.message || 'Khong the cap nhat ho so.')
      setStatus(profileStatus)
      setMessage(profileStatus === 'published' ? 'Da duyet va public.' : 'Da chuyen ve ban nhap.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khong the cap nhat ho so.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="cms-artist-review-actions">
    <span className="cms-status-chip">{status}</span>
    {status !== 'published' ? <button type="button" className="button-secondary" disabled={busy} onClick={() => void update('published')}>Duyet public</button> : <button type="button" className="button-secondary" disabled={busy} onClick={() => void update('draft')}>An profile</button>}
    {message ? <small>{message}</small> : null}
  </div>
}
