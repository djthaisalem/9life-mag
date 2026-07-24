'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function CmsReferralActions({ referralId }: { referralId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const deleteReferral = () => {
    if (!window.confirm('Xóa link referral này? Thao tác không thể hoàn tác.')) return

    startTransition(async () => {
      const response = await fetch(`/api/cms/referrals/${referralId}`, { method: 'DELETE' })
      const result = (await response.json()) as { ok: boolean; message?: string }
      if (!result.ok) {
        setMessage(result.message ?? 'Không thể xóa link.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="cms-table-actions">
      <button type="button" className="cms-table-link" onClick={deleteReferral} disabled={isPending}>
        {isPending ? 'Đang xóa...' : 'Xóa link'}
      </button>
      {message ? <span className="cms-table-action-error">{message}</span> : null}
    </div>
  )
}
