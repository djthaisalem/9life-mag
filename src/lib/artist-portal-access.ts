import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getAuthenticatedSiteSession,
  SITE_ARTIST_SESSION_COOKIE,
  type ArtistPortalRole,
} from '@/lib/site-user-session'

export async function requireArtistPortalAccess(role: ArtistPortalRole) {
  const cookieStore = await cookies()
  const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_ARTIST_SESSION_COOKIE)?.value)

  if (!authenticated) {
    redirect('/tai-khoan/nghe-si')
  }

  const { account } = authenticated
  const portalRole = account.portalRole ?? 'artist'
  const portalAccessStatus = account.portalAccessStatus ?? (portalRole === 'artist' ? 'approved' : 'pending')
  if (account.accountType !== 'artist' || portalRole !== role || portalAccessStatus !== 'approved') {
    redirect('/tai-khoan/nghe-si?access=denied')
  }

  return account
}

export async function getArtistPortalApiAccess(role: ArtistPortalRole) {
  const cookieStore = await cookies()
  const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_ARTIST_SESSION_COOKIE)?.value)

  if (!authenticated) return null

  const { account } = authenticated
  const portalRole = account.portalRole ?? 'artist'
  const portalAccessStatus = account.portalAccessStatus ?? (portalRole === 'artist' ? 'approved' : 'pending')
  if (account.accountType !== 'artist' || portalRole !== role || portalAccessStatus !== 'approved') {
    return null
  }

  return account
}

export async function getPortalNotificationIdentity() {
  const cookieStore = await cookies()
  const authenticated = await getAuthenticatedSiteSession(cookieStore.get(SITE_ARTIST_SESSION_COOKIE)?.value)
  if (!authenticated || authenticated.account.accountType !== 'artist') return null
  const account = authenticated.account
  const role = account.portalRole ?? 'artist'
  const status = account.portalAccessStatus ?? (role === 'artist' ? 'approved' : 'pending')
  if (status !== 'approved') return null
  return { account, recipientKeys: [account.id, ...(account.managedAgent ? [`agent:${account.managedAgent}`] : [])] }
}
