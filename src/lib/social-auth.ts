import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { env } from '@/lib/env'
import {
  createSiteSessionToken,
  getSiteSessionCookieOptions,
  SITE_SESSION_COOKIE,
  upsertSocialSiteUser,
} from '@/lib/site-user-session'

export type SocialProvider = 'google' | 'facebook'

type SocialProfile = {
  provider: SocialProvider
  email?: string
  fullName?: string
  avatarUrl?: string
}

const SOCIAL_AUTH_COOKIE = 'nine_life_social_state'

function getBaseUrl() {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
}

function getCallbackUrl(provider: SocialProvider) {
  return `${getBaseUrl()}/api/auth/social/${provider}/callback`
}

export function getProviderConfig(provider: SocialProvider) {
  if (provider === 'google') {
    return {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    }
  }

  return {
    clientId: env.FACEBOOK_APP_ID ?? '',
    clientSecret: env.FACEBOOK_APP_SECRET ?? '',
  }
}

export async function startSocialAuth(provider: SocialProvider) {
  const { clientId } = getProviderConfig(provider)
  if (!clientId) {
    redirect(`/tai-khoan/oauth-callback?error=missing_${provider}_config`)
  }

  const state = randomUUID()
  const store = await cookies()
  store.set(SOCIAL_AUTH_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  const callbackUrl = getCallbackUrl(provider)

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    })

    redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'public_profile,email',
    state,
  })

  redirect(`https://www.facebook.com/dialog/oauth?${params.toString()}`)
}

function buildErrorRedirect(reason: string) {
  return `${getBaseUrl()}/tai-khoan/oauth-callback?error=${encodeURIComponent(reason)}`
}

async function verifyState(provider: SocialProvider, state: string) {
  const store = await cookies()
  const cookieValue = store.get(SOCIAL_AUTH_COOKIE)?.value
  store.delete(SOCIAL_AUTH_COOKIE)
  return cookieValue === `${provider}:${state}`
}

async function completeSocialLogin(profile: SocialProfile) {
  const account = await upsertSocialSiteUser({
    provider: profile.provider,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  })

  if (!account) {
    redirect(buildErrorRedirect('social_profile_missing_email'))
  }

  const sessionToken = await createSiteSessionToken({
    userId: account.id,
    accountType: 'user',
  })

  const store = await cookies()
  store.set(SITE_SESSION_COOKIE, sessionToken, getSiteSessionCookieOptions())
  redirect(`${getBaseUrl()}/tai-khoan/dashboard`)
}

export async function finishGoogleAuth(input: { code: string; state: string }) {
  const isValidState = await verifyState('google', input.state)
  if (!isValidState) {
    redirect(buildErrorRedirect('invalid_google_state'))
  }

  const { clientId, clientSecret } = getProviderConfig('google')
  if (!clientId || !clientSecret) {
    redirect(buildErrorRedirect('missing_google_config'))
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl('google'),
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  })

  if (!tokenResponse.ok) {
    redirect(buildErrorRedirect('google_token_failed'))
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    redirect(buildErrorRedirect('google_missing_access_token'))
  }

  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    redirect(buildErrorRedirect('google_profile_failed'))
  }

  const profile = (await userResponse.json()) as {
    email?: string
    name?: string
    picture?: string
  }

  await completeSocialLogin({
    provider: 'google',
    email: profile.email,
    fullName: profile.name,
    avatarUrl: profile.picture,
  })
}

export async function finishFacebookAuth(input: { code: string; state: string }) {
  const isValidState = await verifyState('facebook', input.state)
  if (!isValidState) {
    redirect(buildErrorRedirect('invalid_facebook_state'))
  }

  const { clientId, clientSecret } = getProviderConfig('facebook')
  if (!clientId || !clientSecret) {
    redirect(buildErrorRedirect('missing_facebook_config'))
  }

  const tokenUrl = new URL('https://graph.facebook.com/oauth/access_token')
  tokenUrl.searchParams.set('client_id', clientId)
  tokenUrl.searchParams.set('client_secret', clientSecret)
  tokenUrl.searchParams.set('redirect_uri', getCallbackUrl('facebook'))
  tokenUrl.searchParams.set('code', input.code)

  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' })
  if (!tokenResponse.ok) {
    redirect(buildErrorRedirect('facebook_token_failed'))
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    redirect(buildErrorRedirect('facebook_missing_access_token'))
  }

  const profileUrl = new URL('https://graph.facebook.com/me')
  profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)')
  profileUrl.searchParams.set('access_token', tokenData.access_token)

  const userResponse = await fetch(profileUrl, { cache: 'no-store' })
  if (!userResponse.ok) {
    redirect(buildErrorRedirect('facebook_profile_failed'))
  }

  const profile = (await userResponse.json()) as {
    email?: string
    name?: string
    picture?: { data?: { url?: string } }
  }

  await completeSocialLogin({
    provider: 'facebook',
    email: profile.email,
    fullName: profile.name,
    avatarUrl: profile.picture?.data?.url,
  })
}
