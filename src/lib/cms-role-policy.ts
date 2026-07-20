export type CmsScope = 'api_security' | 'booking' | 'stars' | 'content' | 'music' | 'artists' | 'overview' | 'private_contacts'

type CmsScopeGrant = CmsScope | '*'

const roleScopes: Record<string, CmsScopeGrant[]> = {
  super_admin: ['*'],
  security_admin: ['api_security', 'overview'],
  finance_ops: ['stars'],
  booking_ops: ['booking'],
  artist_ops: ['artists', 'booking', 'music'],
  editor: ['content', 'music'],
}

export function normalizeCmsRole(role?: string | null) {
  return role?.trim().toLowerCase().replace(/\s+/g, '_') || 'viewer'
}

export function hasCmsScope(role: string, scope: CmsScope) {
  const scopes = roleScopes[normalizeCmsRole(role)]
  return Boolean(scopes?.includes('*') || scopes?.includes(scope))
}

export function getCmsDashboardScope(pathname: string): CmsScope {
  if (pathname === '/cms/dashboard') return 'overview'
  if (pathname.startsWith('/cms/dashboard/articles')) return 'content'
  if (pathname.startsWith('/cms/dashboard/music')) return 'music'
  if (pathname.startsWith('/cms/dashboard/artists')) return 'artists'
  if (pathname.startsWith('/cms/dashboard/booking') || pathname.startsWith('/cms/dashboard/outlets')) return 'booking'
  if (pathname.startsWith('/cms/dashboard/stars') || pathname.startsWith('/cms/dashboard/referrals')) return 'stars'
  return 'api_security'
}
