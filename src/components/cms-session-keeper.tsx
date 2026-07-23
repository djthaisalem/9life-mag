'use client'

import { useEffect } from 'react'

export function CmsSessionKeeper() {
  useEffect(() => {
    const refreshSession = () => {
      void fetch('/api/cms/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      }).catch(() => undefined)
    }

    refreshSession()
    const timer = window.setInterval(refreshSession, 5 * 60 * 1000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshSession()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
