'use client'

import { useRouter } from 'next/navigation'

export function DashboardLogoutButton({ accountType }: { accountType: 'user' | 'artist' }) {
  const router = useRouter()

  const logout = async () => {
    await fetch(`/api/auth/session?accountType=${accountType}`, { method: 'DELETE', credentials: 'same-origin' })
    router.replace(accountType === 'artist' ? '/tai-khoan/nghe-si' : '/tai-khoan')
    router.refresh()
  }

  return <button type="button" className="button-secondary" onClick={() => void logout()}>Đăng xuất</button>
}
