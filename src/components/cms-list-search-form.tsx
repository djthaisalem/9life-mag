'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function CmsListSearchForm({ action, className, children }: { action: string; className: string; children: ReactNode }) {
  const router = useRouter()

  return (
    <form
      action={action}
      className={className}
      method="get"
      onSubmit={(event) => {
        event.preventDefault()
        const params = new URLSearchParams()
        new FormData(event.currentTarget).forEach((value, key) => {
          const normalized = String(value).trim()
          if (normalized) params.set(key, normalized)
        })
        router.push(`${action}${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
      }}
    >
      {children}
    </form>
  )
}
