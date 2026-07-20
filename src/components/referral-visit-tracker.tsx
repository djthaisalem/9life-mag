'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralVisitTracker() {
  const searchParams = useSearchParams()
  const token = searchParams.get('ref')

  useEffect(() => {
    if (!token || !/^[a-f0-9]{32}$/i.test(token)) return
    let active = true
    void fetch('/api/referrals', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'visit', token }) })
    const timer = window.setTimeout(() => {
      if (active) void fetch('/api/referrals', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'qualify', token }) })
    }, 30_000)
    return () => { active = false; window.clearTimeout(timer) }
  }, [token])

  return null
}
