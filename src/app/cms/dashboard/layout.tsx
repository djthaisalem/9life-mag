import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CmsCapabilityProvider } from '@/components/cms-capability-provider'
import { CmsSessionKeeper } from '@/components/cms-session-keeper'
import { createCmsCapabilityToken } from '@/lib/cms-capability'
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

  const scopes = ['api_security', 'booking', 'stars', 'content', 'music', 'artists', 'overview', 'private_contacts'] as const
  const capabilities = Object.fromEntries(
    scopes.map((scope) => [scope, createCmsCapabilityToken({ email: session.email, role: session.role, scope })]),
  ) as Record<(typeof scopes)[number], string>

  return (
    <CmsCapabilityProvider capabilities={capabilities}>
      <CmsSessionKeeper />
      {children}
    </CmsCapabilityProvider>
  )
}
