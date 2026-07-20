export type UserAccessState = {
  isAuthenticated: boolean
  stars: number
  starSources: {
    signup: number
    daily: number
    bonus: number
    playlist: number
    share: number
  }
  followedArtists: string[]
  followedAgents: string[]
  hasClaimedDailyToday: boolean
  hasClaimedBonusToday: boolean
  canClaimDaily: boolean
  canClaimBonus: boolean
  isPastNoon: boolean
}

export type StoredUserProfile = {
  provider: 'local' | 'google' | 'facebook'
  email?: string
  fullName?: string
  avatarUrl?: string
}

type AccessApiResponse = {
  ok: boolean
  reason?: 'not_authenticated' | 'insufficient_stars' | 'already_claimed' | 'bonus_locked'
  message?: string
  state: UserAccessState
  profile: StoredUserProfile | null
  userId?: string
}

const emptyState: UserAccessState = {
  isAuthenticated: false,
  stars: 0,
  starSources: { signup: 0, daily: 0, bonus: 0, playlist: 0, share: 0 },
  followedArtists: [],
  followedAgents: [],
  hasClaimedDailyToday: false,
  hasClaimedBonusToday: false,
  canClaimDaily: false,
  canClaimBonus: false,
  isPastNoon: false,
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T
}

export async function fetchUserAccessState() {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })

  if (!response.ok) {
    return {
      ok: false,
      state: emptyState,
      profile: null,
    } satisfies AccessApiResponse
  }

  return readJson<AccessApiResponse>(response)
}

export async function loginDemoUser(identity: string, password: string) {
  const response = await fetch('/api/auth/session/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity,
      password,
      accountType: 'user',
    }),
  })

  return readJson<{
    ok: boolean
    message?: string
  }>(response)
}

export async function registerUserAccount(input: {
  fullName: string
  email: string
  password: string
  phone?: string
}) {
  const response = await fetch('/api/auth/session/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      accountType: 'user',
    }),
  })

  return readJson<{
    ok: boolean
    message?: string
  }>(response)
}

export async function logoutUser() {
  await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  })
}

export async function spendUserStars(amount: number, purpose: 'general' | 'vote' | 'playback' | 'download' = 'general') {
  const response = await fetch('/api/auth/stars/spend', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, purpose }),
  })

  return readJson<AccessApiResponse>(response)
}

export async function accessTrackWithStars(trackId: string, kind: 'playback' | 'download') {
  const response = await fetch('/api/auth/stars/media-access', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trackId, kind }),
  })

  return readJson<AccessApiResponse & { alreadyCharged?: boolean; charged?: boolean }>(response)
}

export async function claimDailyStars() {
  const response = await fetch('/api/auth/stars/claim-daily', {
    method: 'POST',
    credentials: 'same-origin',
  })

  return readJson<AccessApiResponse>(response)
}

export async function claimBonusStars() {
  const response = await fetch('/api/auth/stars/claim-bonus', {
    method: 'POST',
    credentials: 'same-origin',
  })

  return readJson<AccessApiResponse>(response)
}

export async function toggleFollowedArtist(slug: string) {
  const response = await fetch('/api/auth/follow', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  })

  const result = await readJson<AccessApiResponse>(response)
  return result.state.followedArtists
}

export async function toggleFollowedAgent(slug: string) {
  const response = await fetch('/api/auth/follow', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug, target: 'agent' }),
  })

  const result = await readJson<AccessApiResponse>(response)
  return result.state.followedAgents
}
