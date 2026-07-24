'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const QUALIFY_DELAY_MS = 31_500
const QUALIFY_RETRY_DELAY_MS = 2_000

async function sendReferralEvent(action: 'visit' | 'qualify', token: string) {
  const response = await fetch('/api/referrals', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token }),
  })
  return (await response.json()) as { ok?: boolean }
}

export function ReferralVisitTracker() {
  const searchParams = useSearchParams()
  const token = searchParams.get('ref')

  useEffect(() => {
    if (!token || !/^[a-f0-9]{32}$/i.test(token)) return
    let active = true
    let timer: number | undefined

    void sendReferralEvent('visit', token).then((visit) => {
      if (!active || !visit.ok) return

      timer = window.setTimeout(() => {
        if (!active) return
        void sendReferralEvent('qualify', token).then((qualification) => {
          if (!active || qualification.ok) return
          window.setTimeout(() => {
            if (active) void sendReferralEvent('qualify', token)
          }, QUALIFY_RETRY_DELAY_MS)
        })
      }, QUALIFY_DELAY_MS)
    }).catch(() => undefined)

    return () => { active = false; window.clearTimeout(timer) }
  }, [token])

  return null
}
