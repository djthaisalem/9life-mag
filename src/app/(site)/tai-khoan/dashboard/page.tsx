import { Suspense } from 'react'
import { UserDashboardClient } from './user-dashboard-client'

export default function UserDashboardPage() {
  return (
    <Suspense fallback={null}>
      <UserDashboardClient />
    </Suspense>
  )
}
