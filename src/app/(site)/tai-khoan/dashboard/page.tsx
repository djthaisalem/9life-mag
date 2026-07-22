import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuthenticatedSiteSession, getSiteSessionSnapshot, SITE_SESSION_COOKIE } from '@/lib/site-user-session'
import { UserDashboardClient } from './user-dashboard-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UserDashboardPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SITE_SESSION_COOKIE)?.value
  const authenticated = await getAuthenticatedSiteSession(sessionToken)

  if (!authenticated) {
    redirect('/tai-khoan?login=required')
  }

  if (authenticated.account.accountType !== 'user') {
    redirect('/tai-khoan/nghe-si')
  }

  const snapshot = await getSiteSessionSnapshot(sessionToken)

  return (
    <Suspense fallback={null}>
      <UserDashboardClient initialProfile={snapshot.profile!} initialAccessState={snapshot.state} />
    </Suspense>
  )
}
