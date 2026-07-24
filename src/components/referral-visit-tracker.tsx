'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const QUALIFY_DELAY_MS = 31_500
const QUALIFY_RETRY_DELAY_MS = 5_000
const QUALIFY_MAX_RETRIES = 12
const STORAGE_KEY = 'nine_life_active_referral'

type ActiveReferral = {
  token: string
  startedAt: number
  timer?: number
}

async function sendReferralEvent(action: 'visit' | 'qualify', token: string, keepalive = false) {
  const response = await fetch('/api/referrals', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token }),
    keepalive,
  })
  return (await response.json()) as { ok?: boolean }
}

function readStoredReferral() {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    if (!value) return null
    const referral = JSON.parse(value) as Pick<ActiveReferral, 'token' | 'startedAt'>
    return /^[a-f0-9]{32}$/i.test(referral.token) && Number.isFinite(referral.startedAt) ? referral : null
  } catch {
    return null
  }
}

function saveStoredReferral(referral: Pick<ActiveReferral, 'token' | 'startedAt'>) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(referral))
}

export function ReferralVisitTracker() {
  const searchParams = useSearchParams()
  const queryToken = searchParams.get('ref')
  const activeRef = useRef<ActiveReferral | null>(null)

  useEffect(() => {
    const stored = readStoredReferral()
    const token = queryToken && /^[a-f0-9]{32}$/i.test(queryToken) ? queryToken : stored?.token
    if (!token || activeRef.current?.token === token) return

    const startTracking = async () => {
      const visit = await sendReferralEvent('visit', token)
      if (!visit.ok) return

      const active: ActiveReferral = { token, startedAt: Date.now() }
      activeRef.current = active
      saveStoredReferral(active)

      const qualify = async (attempt = 0) => {
        const result = await sendReferralEvent('qualify', token)
        if (result.ok) {
          if (activeRef.current?.token === token) activeRef.current = null
          window.sessionStorage.removeItem(STORAGE_KEY)
          return
        }
        if (attempt < QUALIFY_MAX_RETRIES && activeRef.current?.token === token) {
          active.timer = window.setTimeout(() => { void qualify(attempt + 1) }, QUALIFY_RETRY_DELAY_MS)
        }
      }

      active.timer = window.setTimeout(() => { void qualify() }, QUALIFY_DELAY_MS)
    }

    void startTracking().catch(() => undefined)
  }, [queryToken])

  useEffect(() => {
    const qualifyBeforeLeaving = () => {
      const active = activeRef.current
      if (!active || Date.now() - active.startedAt < QUALIFY_DELAY_MS) return
      void sendReferralEvent('qualify', active.token, true)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') qualifyBeforeLeaving()
    }
    window.addEventListener('pagehide', qualifyBeforeLeaving)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', qualifyBeforeLeaving)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      activeRef.current?.timer && window.clearTimeout(activeRef.current.timer)
    }
  }, [])

  return null
}
