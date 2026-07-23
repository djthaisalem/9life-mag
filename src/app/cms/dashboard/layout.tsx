import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'
import { getCmsDashboardScope, hasCmsScope } from '@/lib/cms-role-policy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)

  if (!session) {
    redirect('/cms')
  }

  const headerStore = await headers()
  const pathname = headerStore.get('x-cms-pathname') || '/cms/dashboard'
  if (!hasCmsScope(session.role, getCmsDashboardScope(pathname))) {
    redirect('/cms/forbidden')
  }

  return children
}
