import 'server-only'

import { createHash, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { assertProductionPersistence, canUseDevelopmentSeeds, getRuntimeSecret } from '@/lib/runtime-security'
import { getRecentPremiumAccess, hasRecentMediaStarCharge, recordWalletLedgerEntry, type WalletEventType } from '@/lib/wallet-ledger'

export const SITE_SESSION_COOKIE = 'nine_life_site_session_v2'

const SITE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const SIGNUP_STARS = 100
const DAILY_STARS = 10
const BONUS_STARS = 5
const STORE_PATH = path.join(process.cwd(), 'data', 'site-accounts.json')
const walletLocks = new Map<string, Promise<void>>()

export type SiteAccountType = 'user' | 'artist'
export type SiteAuthProvider = 'local' | 'google' | 'facebook'
export type ArtistPortalRole = 'artist' | 'manager' | 'booking'
export type ArtistPortalAccessStatus = 'pending' | 'approved' | 'suspended'

export type StoredUserProfile = {
  provider: SiteAuthProvider
  email?: string
  fullName?: string
  avatarUrl?: string
}

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

export type SiteSession = {
  userId: string
  accountType: SiteAccountType
  portalRole?: ArtistPortalRole
  portalAccessStatus?: ArtistPortalAccessStatus
  issuedAt: number
  expiresAt: number
}

type SiteAccountRecord = {
  id: string
  accountType: SiteAccountType
  portalRole?: ArtistPortalRole
  portalAccessStatus?: ArtistPortalAccessStatus
  managedAgent?: string
  artistAgent?: string
  artistProfileSlug?: string
  managedOutletSlugs?: string[]
  provider: SiteAuthProvider
  identity: string
  email?: string
  phone?: string
  fullName: string
  avatarUrl?: string
  passwordHash: string
  stars: number
  signupStarsEarned?: number
  dailyStarsEarned?: number
  bonusStarsEarned?: number
  playlistStarsEarned?: number
  shareStarsEarned?: number
  followedArtists: string[]
  followedAgents?: string[]
  dailyClaimDate?: string
  bonusClaimDate?: string
  isActive?: boolean
  sessionInvalidAfter?: string
  createdAt: string
  updatedAt: string
}

export type CmsSiteAccount = {
  id: string
  name: string
  email: string
  phone: string
  accountType: SiteAccountType
  portalRole?: ArtistPortalRole
  portalAccessStatus?: ArtistPortalAccessStatus
  role: string
  stars: number
  isPremium: boolean
  isActive: boolean
  createdAt: string
  followedArtists: number
}

type SiteAccountStore = {
  accounts: SiteAccountRecord[]
}

type AccessResult = {
  ok: boolean
  reason?: 'not_authenticated' | 'insufficient_stars' | 'already_claimed' | 'bonus_locked'
  state: UserAccessState
  profile: StoredUserProfile | null
  userId?: string
}

type RegisterSiteAccountInput = {
  fullName?: string
  email?: string
  password: string
  phone?: string
  accountType?: SiteAccountType
  portalRole?: ArtistPortalRole
}

type RegisterSiteAccountResult =
  | {
      ok: true
      token: string
      account: SiteAccountRecord
    }
  | {
      ok: false
      reason: 'duplicate_identity' | 'invalid_input'
    }

function getSessionSecret() {
  return getRuntimeSecret('SITE_SESSION_SECRET', 'site-session')
}

function getStorageDriver() {
  assertProductionPersistence()
  return env.SITE_USER_STORAGE_DRIVER
}

function normalizeIdentity(identity: string) {
  return identity.trim().toLowerCase()
}

function normalizePortalRole(value?: unknown): ArtistPortalRole {
  return value === 'manager' || value === 'booking' ? value : 'artist'
}

function normalizePortalAccessStatus(value: unknown, portalRole: ArtistPortalRole): ArtistPortalAccessStatus {
  if (value === 'pending' || value === 'suspended' || value === 'approved') return value
  return portalRole === 'artist' ? 'approved' : 'pending'
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

function createPhoneAccountEmail(phone: string) {
  const digest = createHash('sha256').update(phone).digest('hex').slice(0, 32)
  return `phone.${digest}@accounts.9lifemag.invalid`
}

function isPhoneAccountEmail(email: string) {
  return email.endsWith('@accounts.9lifemag.invalid')
}

function getRegistrationName(input: RegisterSiteAccountInput, email: string, phone: string) {
  const suppliedName = input.fullName?.trim()
  if (suppliedName) return suppliedName
  if (email && !isPhoneAccountEmail(email)) return email.split('@')[0] || 'Thành viên 9LIFE'
  return phone ? `Thành viên ${phone.slice(-4)}` : 'Thành viên 9LIFE'
}

function normalizeLookupIdentity(identity: string) {
  const trimmed = identity.trim()
  return trimmed.includes('@') ? normalizeIdentity(trimmed) : normalizePhone(trimmed)
}

function isEmailIdentity(identity: string) {
  return identity.includes('@')
}

function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isPastNoon(date = new Date()) {
  return date.getHours() >= 12
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Buffer.from(signature).toString('base64url')
}

function hashPassword(password: string, salt = randomUUID()) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) return false

  const derived = scryptSync(password, salt, 64)
  const expected = Buffer.from(storedHash, 'hex')
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}

function emptyStore(): SiteAccountStore {
  if (!canUseDevelopmentSeeds()) {
    return {
      accounts: [],
    }
  }

  const now = new Date().toISOString()

  return {
    accounts: [
      {
        id: 'member-9life',
        accountType: 'user',
        provider: 'local',
        identity: 'member@9lifemag.com',
        email: 'member@9lifemag.com',
        fullName: '9LIFE Member',
        passwordHash: hashPassword('9life123'),
        stars: SIGNUP_STARS,
        followedArtists: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'artist-portal-9life',
        accountType: 'artist',
        portalRole: 'artist',
        portalAccessStatus: 'approved',
        artistProfileSlug: 'neon-viper',
        provider: 'local',
        identity: 'artist@9lifemag.com',
        email: 'artist@9lifemag.com',
        fullName: '9LIFE Artist',
        passwordHash: hashPassword('artist123'),
        stars: 0,
        followedArtists: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'manager-portal-9life',
        accountType: 'artist',
        portalRole: 'manager',
        portalAccessStatus: 'approved',
        managedAgent: '9Life Artist Ops',
        provider: 'local',
        identity: 'manager@9lifemag.com',
        email: 'manager@9lifemag.com',
        fullName: '9LIFE Manager',
        passwordHash: hashPassword('manager123'),
        stars: 0,
        followedArtists: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'booking-portal-9life',
        accountType: 'artist',
        portalRole: 'booking',
        portalAccessStatus: 'approved',
        managedOutletSlugs: ['district-9-pulse', 'halo-rooftop'],
        provider: 'local',
        identity: 'booking@9lifemag.com',
        email: 'booking@9lifemag.com',
        fullName: '9LIFE Booking Coordinator',
        passwordHash: hashPassword('booking123'),
        stars: 0,
        followedArtists: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
  }
}

async function readFileStore() {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(content) as SiteAccountStore
    const store = {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    }
    if (canUseDevelopmentSeeds()) {
      const previewAccounts = emptyStore().accounts.filter((account) => account.accountType === 'artist')
      const missing = previewAccounts.filter((account) => !store.accounts.some((current) => current.email === account.email))
      let updated = false
      for (const seed of previewAccounts) {
        const current = store.accounts.find((account) => account.email === seed.email)
        if (!current) continue
        if (seed.portalRole === 'manager' && !current.managedAgent && seed.managedAgent) {
          current.managedAgent = seed.managedAgent
          updated = true
        }
        if (seed.portalRole === 'booking' && !current.managedOutletSlugs?.length && seed.managedOutletSlugs?.length) {
          current.managedOutletSlugs = seed.managedOutletSlugs
          updated = true
        }
        if (seed.portalRole === 'artist' && !current.artistProfileSlug && seed.artistProfileSlug) {
          current.artistProfileSlug = seed.artistProfileSlug
          updated = true
        }
      }
      if (missing.length) {
        store.accounts.push(...missing)
        updated = true
      }
      if (updated) await writeFileStore(store)
    }
    return store
  } catch {
    const initial = emptyStore()
    await writeFileStore(initial)
    return initial
  }
}

async function writeFileStore(store: SiteAccountStore) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function findAccountByIdentity(accounts: SiteAccountRecord[], identity: string, accountType: SiteAccountType) {
  const normalized = normalizeLookupIdentity(identity)

  return accounts.find((account) => {
    if (account.accountType !== accountType) return false
    if (normalizeLookupIdentity(account.identity) === normalized) return true
    if (account.email && normalizeIdentity(account.email) === normalized) return true
    if (account.phone && normalizePhone(account.phone) === normalized) return true
    return false
  })
}

function buildStoredProfile(account: SiteAccountRecord): StoredUserProfile {
  return {
    provider: account.provider,
    email: account.email,
    fullName: account.fullName,
    avatarUrl: account.avatarUrl,
  }
}

function buildUserAccessStateFromAccount(account?: SiteAccountRecord | null): UserAccessState {
  const todayKey = getTodayKey()
  const authenticated = Boolean(account)
  const dailyClaimed = account?.dailyClaimDate === todayKey
  const bonusClaimed = account?.bonusClaimDate === todayKey
  const currentStars = authenticated ? Math.max(account?.stars ?? 0, 0) : 0
  const pastNoon = isPastNoon()

  return {
    isAuthenticated: authenticated,
    stars: currentStars,
    starSources: {
      signup: authenticated && account?.accountType === 'user' ? account.signupStarsEarned ?? SIGNUP_STARS : 0,
      daily: account?.dailyStarsEarned ?? 0,
      bonus: account?.bonusStarsEarned ?? 0,
      playlist: account?.playlistStarsEarned ?? 0,
      share: account?.shareStarsEarned ?? 0,
    },
    followedArtists: account?.followedArtists ?? [],
    followedAgents: account?.followedAgents ?? [],
    hasClaimedDailyToday: dailyClaimed,
    hasClaimedBonusToday: bonusClaimed,
    canClaimDaily: authenticated && !dailyClaimed,
    canClaimBonus: authenticated && dailyClaimed && !bonusClaimed && pastNoon && currentStars <= 0,
    isPastNoon: pastNoon,
  }
}

function buildAccessResult(account?: SiteAccountRecord | null, reason?: AccessResult['reason']): AccessResult {
  return {
    ok: !reason,
    reason,
    state: buildUserAccessStateFromAccount(account),
    profile: account ? buildStoredProfile(account) : null,
    userId: account?.id,
  }
}

function normalizePayloadUser(doc: Record<string, unknown> | null | undefined): SiteAccountRecord | null {
  if (!doc || !doc.id) return null

  const followedArtistRows = Array.isArray(doc.followedArtistSlugs)
    ? (doc.followedArtistSlugs as Array<{ slug?: string }>).map((item) => item?.slug).filter((item): item is string => Boolean(item))
    : []
  const followedAgentRows = Array.isArray(doc.followedAgentSlugs)
    ? (doc.followedAgentSlugs as Array<{ slug?: string }>).map((item) => item?.slug).filter((item): item is string => Boolean(item))
    : []

  return {
    id: String(doc.id),
    accountType: doc.accountType === 'artist' ? 'artist' : 'user',
    portalRole: normalizePortalRole(doc.portalRole),
    portalAccessStatus: normalizePortalAccessStatus(doc.portalAccessStatus, normalizePortalRole(doc.portalRole)),
    managedAgent: typeof doc.managedAgent === 'string' ? doc.managedAgent : undefined,
    artistAgent: typeof doc.artistAgent === 'string' ? doc.artistAgent : undefined,
    artistProfileSlug: typeof doc.artistProfileSlug === 'string' ? doc.artistProfileSlug : undefined,
    managedOutletSlugs: Array.isArray(doc.managedOutletSlugs)
      ? (doc.managedOutletSlugs as Array<{ slug?: string }>).map((item) => item.slug).filter((item): item is string => Boolean(item))
      : [],
    provider:
      doc.socialProvider === 'google' || doc.socialProvider === 'facebook'
        ? doc.socialProvider
        : 'local',
    identity:
      typeof doc.phone === 'string' && typeof doc.email === 'string' && isPhoneAccountEmail(doc.email)
        ? doc.phone
        : typeof doc.email === 'string' && doc.email
          ? doc.email
          : typeof doc.phone === 'string'
            ? doc.phone
            : String(doc.id),
    email:
      typeof doc.email === 'string' && !isPhoneAccountEmail(doc.email)
        ? doc.email
        : undefined,
    phone: typeof doc.phone === 'string' ? doc.phone : undefined,
    fullName: typeof doc.fullName === 'string' && doc.fullName ? doc.fullName : '9LIFE Member',
    avatarUrl: undefined,
    passwordHash: '',
    stars: typeof doc.stars === 'number' ? doc.stars : SIGNUP_STARS,
    signupStarsEarned: typeof doc.signupStarsEarned === 'number' ? doc.signupStarsEarned : doc.accountType === 'artist' ? 0 : SIGNUP_STARS,
    dailyStarsEarned: typeof doc.dailyStarsEarned === 'number' ? doc.dailyStarsEarned : 0,
    bonusStarsEarned: typeof doc.bonusStarsEarned === 'number' ? doc.bonusStarsEarned : 0,
    playlistStarsEarned: typeof doc.playlistStarsEarned === 'number' ? doc.playlistStarsEarned : 0,
    shareStarsEarned: typeof doc.shareStarsEarned === 'number' ? doc.shareStarsEarned : 0,
    followedArtists: followedArtistRows,
    followedAgents: followedAgentRows,
    dailyClaimDate: typeof doc.dailyClaimDate === 'string' ? doc.dailyClaimDate.slice(0, 10) : undefined,
    bonusClaimDate: typeof doc.bonusClaimDate === 'string' ? doc.bonusClaimDate.slice(0, 10) : undefined,
    isActive: doc.isActive !== false,
    sessionInvalidAfter: typeof doc.sessionInvalidAfter === 'string' ? doc.sessionInvalidAfter : undefined,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
  }
}

async function ensurePayloadSeedUsers() {
  if (!canUseDevelopmentSeeds()) {
    return
  }

  const payload = await loadPayloadClient()

  const defaults = [
    {
      email: 'member@9lifemag.com',
      password: '9life123',
      fullName: '9LIFE Member',
      accountType: 'user' as const,
      role: 'customer',
      stars: SIGNUP_STARS,
    },
    {
      email: 'artist@9lifemag.com',
      password: 'artist123',
      fullName: '9LIFE Artist',
      accountType: 'artist' as const,
      role: 'customer',
      portalRole: 'artist' as const,
      portalAccessStatus: 'approved' as const,
      artistProfileSlug: 'neon-viper',
      stars: 0,
    },
    {
      email: 'manager@9lifemag.com',
      password: 'manager123',
      fullName: '9LIFE Manager',
      accountType: 'artist' as const,
      role: 'customer',
      portalRole: 'manager' as const,
      portalAccessStatus: 'approved' as const,
      managedAgent: '9Life Artist Ops',
      stars: 0,
    },
    {
      email: 'booking@9lifemag.com',
      password: 'booking123',
      fullName: '9LIFE Booking Coordinator',
      accountType: 'artist' as const,
      role: 'customer',
      portalRole: 'booking' as const,
      portalAccessStatus: 'approved' as const,
      managedOutletSlugs: ['district-9-pulse', 'halo-rooftop'],
      stars: 0,
    },
  ]

  for (const seed of defaults) {
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: seed.email,
        },
      },
      limit: 1,
      depth: 0,
      pagination: false,
    })

    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'users',
      data: {
        email: seed.email,
        password: seed.password,
        fullName: seed.fullName,
        accountType: seed.accountType,
        role: seed.role,
        portalRole: seed.portalRole,
        portalAccessStatus: seed.portalAccessStatus,
        managedAgent: seed.managedAgent,
        artistProfileSlug: seed.artistProfileSlug,
        managedOutletSlugs: seed.managedOutletSlugs?.map((slug) => ({ slug })),
        socialProvider: 'local',
        stars: seed.stars,
        isActive: true,
      },
    })
  }
}

async function findPayloadAccountByIdentity(identity: string, accountType: SiteAccountType) {
  await ensurePayloadSeedUsers()
  const payload = await loadPayloadClient()
  const normalized = normalizeLookupIdentity(identity)
  const queryField = normalized.includes('@') ? 'email' : 'phone'
  const result = await payload.find({
    collection: 'users',
    where: {
      and: [
        {
          [queryField]: {
            equals: normalized,
          },
        },
        {
          accountType: {
            equals: accountType,
          },
        },
      ],
    },
    limit: 1,
    depth: 0,
    pagination: false,
  })

  return normalizePayloadUser((result.docs[0] as Record<string, unknown> | undefined) ?? null)
}

async function findPayloadAccountById(accountId: string) {
  await ensurePayloadSeedUsers()
  const payload = await loadPayloadClient()

  try {
    const doc = await payload.findByID({
      collection: 'users',
      id: accountId,
      depth: 0,
    })

    return normalizePayloadUser(doc as Record<string, unknown>)
  } catch {
    return null
  }
}

async function updatePayloadAccount(accountId: string, data: Record<string, unknown>) {
  const payload = await loadPayloadClient()
  const doc = await payload.update({
    collection: 'users',
    id: accountId,
    data,
    depth: 0,
  })

  return normalizePayloadUser(doc as Record<string, unknown>)
}

function mapFollowedArtistsToPayload(slugs: string[]) {
  return slugs.map((slug) => ({ slug }))
}

async function registerPayloadAccount(input: RegisterSiteAccountInput): Promise<RegisterSiteAccountResult> {
  await ensurePayloadSeedUsers()
  const payload = await loadPayloadClient()
  const providedEmail = normalizeIdentity(input.email ?? '')
  const phone = normalizePhone(input.phone ?? '')
  const email = providedEmail || createPhoneAccountEmail(phone)

  const existing = await payload.find({
    collection: 'users',
    where: {
      or: [
        { email: { equals: email } },
        ...(phone ? [{ phone: { equals: phone } }] : []),
      ],
    },
    limit: 1,
    depth: 0,
    pagination: false,
  })

  if (existing.docs.length > 0) {
    return {
      ok: false,
      reason: 'duplicate_identity',
    }
  }

  const created = await payload.create({
    collection: 'users',
    data: {
      email,
      password: input.password,
      fullName: getRegistrationName(input, email, phone),
      phone: phone || undefined,
      accountType: input.accountType ?? 'user',
      role: 'customer',
      portalRole: normalizePortalRole(input.portalRole),
      portalAccessStatus: input.accountType === 'artist'
        ? normalizePortalAccessStatus(undefined, normalizePortalRole(input.portalRole))
        : 'approved',
      socialProvider: 'local',
      stars: input.accountType === 'artist' ? 0 : SIGNUP_STARS,
      isActive: true,
    },
    depth: 0,
  })

  const account = normalizePayloadUser(created as Record<string, unknown>)
  if (!account) {
    return {
      ok: false,
      reason: 'invalid_input',
    }
  }

  const token = await createSiteSessionToken({
    userId: account.id,
    accountType: account.accountType,
  })

  if (account.accountType === 'user') {
    await recordWalletLedgerEntry({
      userId: account.id,
      amount: SIGNUP_STARS,
      balanceAfter: account.stars,
      eventType: 'signup_bonus',
      reference: `signup-${account.id}`,
      note: 'Initial signup star grant',
    })
  }

  return {
    ok: true,
    token,
    account,
  }
}

async function registerFileAccount(input: RegisterSiteAccountInput): Promise<RegisterSiteAccountResult> {
  const providedEmail = normalizeIdentity(input.email ?? '')
  const phone = normalizePhone(input.phone ?? '')
  const email = providedEmail || createPhoneAccountEmail(phone)
  const store = await readFileStore()
  const exists = store.accounts.some(
    (account) =>
      normalizeIdentity(account.email ?? '') === email ||
      Boolean(phone && normalizePhone(account.phone ?? '') === phone)
  )

  if (exists) {
    return {
      ok: false,
      reason: 'duplicate_identity',
    }
  }

  const now = new Date().toISOString()
  const account: SiteAccountRecord = {
    id: `user-${randomUUID()}`,
    accountType: input.accountType ?? 'user',
    portalRole: normalizePortalRole(input.portalRole),
    portalAccessStatus: input.accountType === 'artist'
      ? normalizePortalAccessStatus(undefined, normalizePortalRole(input.portalRole))
      : 'approved',
    provider: 'local',
    identity: providedEmail || phone,
    email: providedEmail || undefined,
    phone: phone || undefined,
    fullName: getRegistrationName(input, email, phone),
    passwordHash: hashPassword(input.password),
    stars: input.accountType === 'artist' ? 0 : SIGNUP_STARS,
    followedArtists: [],
    createdAt: now,
    updatedAt: now,
  }

  store.accounts.unshift(account)
  await writeFileStore(store)

  const token = await createSiteSessionToken({
    userId: account.id,
    accountType: account.accountType,
  })

  return {
    ok: true,
    token,
    account,
  }
}

async function updateFileAccount(accountId: string, updater: (account: SiteAccountRecord) => void) {
  const store = await readFileStore()
  const account = store.accounts.find((item) => item.id === accountId)
  if (!account) return null

  updater(account)
  account.updatedAt = new Date().toISOString()
  await writeFileStore(store)
  return account
}

export async function createSiteSessionToken(input: { userId: string; accountType: SiteAccountType }) {
  const issuedAt = Date.now()
  const payload: SiteSession = {
    userId: input.userId,
    accountType: input.accountType,
    issuedAt,
    expiresAt: issuedAt + SITE_SESSION_TTL_SECONDS * 1000,
  }

  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = await signValue(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function verifySiteSessionToken(token?: string | null) {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = await signValue(encodedPayload)
  if (signature !== expectedSignature) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SiteSession
    if (!payload.userId || !payload.accountType) return null
    if (payload.expiresAt <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getSiteSessionCookieOptions() {
  // HTTP cookies are permitted only for the explicitly marked VPS demo.
  const allowInsecureHttpDemo = process.env.ALLOW_INSECURE_HTTP_DEMO === 'true'
    && process.env.SITE_USER_STORAGE_DRIVER === 'file'
    && process.env.ALLOW_FILE_STORAGE_IN_PRODUCTION === 'true'

  const configuredHostname = (() => {
    try {
      return new URL(env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase()
    } catch {
      return ''
    }
  })()
  const sharedDomain = configuredHostname === '9lifemag.com' || configuredHostname.endsWith('.9lifemag.com')
    ? '.9lifemag.com'
    : undefined

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production' && !allowInsecureHttpDemo,
    path: '/',
    maxAge: SITE_SESSION_TTL_SECONDS,
    priority: 'high' as const,
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  }
}

function toCmsSiteAccount(account: SiteAccountRecord, role = 'customer', isPremium = false): CmsSiteAccount {
  return {
    id: account.id,
    name: account.fullName,
    email: account.email ?? '',
    phone: account.phone ?? '',
    accountType: account.accountType,
    portalRole: account.portalRole,
    portalAccessStatus: account.portalAccessStatus,
    role,
    stars: account.stars,
    isPremium,
    isActive: account.isActive !== false,
    createdAt: account.createdAt,
    followedArtists: account.followedArtists.length,
  }
}

export async function listSiteAccountsForCms(input: { page: number; limit: number }) {
  const page = Math.max(1, Math.floor(input.page))
  const limit = Math.min(100, Math.max(1, Math.floor(input.limit)))

  if (getStorageDriver() === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'users',
      sort: '-createdAt',
      page,
      limit,
      depth: 0,
    })
    const users = (result.docs as Array<Record<string, unknown>>)
      .map((doc) => {
        const account = normalizePayloadUser(doc)
        return account
          ? toCmsSiteAccount(
              account,
              typeof doc.role === 'string' ? doc.role : 'customer',
              doc.isPremium === true,
            )
          : null
      })
      .filter((account): account is CmsSiteAccount => Boolean(account))

    return {
      users,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? page,
    }
  }

  const accounts = (await readFileStore()).accounts
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const start = (page - 1) * limit
  return {
    users: accounts.slice(start, start + limit).map((account) => toCmsSiteAccount(account)),
    totalDocs: accounts.length,
    totalPages: Math.max(1, Math.ceil(accounts.length / limit)),
    page,
  }
}

export async function getSiteAccountForCms(accountId: string) {
  if (getStorageDriver() === 'payload') {
    const payload = await loadPayloadClient()
    try {
      const doc = await payload.findByID({
        collection: 'users',
        id: accountId,
        depth: 0,
      }) as Record<string, unknown>
      const account = normalizePayloadUser(doc)
      return account
        ? toCmsSiteAccount(
            account,
            typeof doc.role === 'string' ? doc.role : 'customer',
            doc.isPremium === true,
          )
        : null
    } catch {
      return null
    }
  }

  const account = (await readFileStore()).accounts.find((item) => item.id === accountId)
  return account ? toCmsSiteAccount(account) : null
}

export async function updateSiteAccountForCms(input: {
  accountId: string
  fullName: string
  email?: string
  phone?: string
  stars: number
  isPremium: boolean
  isActive: boolean
}) {
  const fullName = input.fullName.trim()
  const email = input.email?.trim().toLowerCase() || undefined
  const phone = normalizePhone(input.phone ?? '') || undefined
  const stars = Math.max(0, Math.floor(input.stars))

  if (getStorageDriver() === 'payload') {
    const account = await updatePayloadAccount(input.accountId, {
      fullName,
      email,
      phone,
      stars,
      isPremium: input.isPremium,
      isActive: input.isActive,
    })
    return account ? getSiteAccountForCms(input.accountId) : null
  }

  const account = await updateFileAccount(input.accountId, (current) => {
    current.fullName = fullName
    current.email = email
    current.phone = phone
    current.stars = stars
    current.isActive = input.isActive
  })
  return account ? getSiteAccountForCms(input.accountId) : null
}

export async function registerSiteAccount(input: RegisterSiteAccountInput) {
  const email = input.email?.trim() ?? ''
  const phone = normalizePhone(input.phone ?? '')
  const accountType = input.accountType ?? 'user'
  const missingUserIdentity = accountType === 'user' && !email && !phone
  const invalidArtistIdentity = accountType === 'artist' && (!input.fullName?.trim() || !email)

  if (missingUserIdentity || invalidArtistIdentity || !input.password.trim()) {
    return {
      ok: false,
      reason: 'invalid_input',
    } satisfies RegisterSiteAccountResult
  }

  return getStorageDriver() === 'payload' ? registerPayloadAccount(input) : registerFileAccount(input)
}

export async function findSiteAccountByIdentity(identity: string, accountType: SiteAccountType) {
  if (getStorageDriver() === 'payload') {
    return findPayloadAccountByIdentity(identity, accountType)
  }

  const store = await readFileStore()
  return findAccountByIdentity(store.accounts, identity, accountType) ?? null
}

export async function getSiteAccountById(accountId: string) {
  if (getStorageDriver() === 'payload') {
    return findPayloadAccountById(accountId)
  }

  const store = await readFileStore()
  return store.accounts.find((account) => account.id === accountId) ?? null
}

export async function updatePortalManagementAssignment(input: {
  accountId: string
  portalRole: Extract<ArtistPortalRole, 'manager' | 'booking'>
  portalAccessStatus: ArtistPortalAccessStatus
  managedAgent?: string
  managedOutletSlugs?: string[]
}) {
  const data = {
    portalRole: input.portalRole,
    portalAccessStatus: input.portalAccessStatus,
    managedAgent: input.portalRole === 'manager' ? input.managedAgent?.trim() || undefined : undefined,
    managedOutletSlugs: input.portalRole === 'booking'
      ? (input.managedOutletSlugs ?? []).filter(Boolean)
      : [],
  }

  if (getStorageDriver() === 'payload') {
    return updatePayloadAccount(input.accountId, {
      ...data,
      managedOutletSlugs: data.managedOutletSlugs.map((slug) => ({ slug })),
    })
  }

  return updateFileAccount(input.accountId, (account) => {
    account.portalRole = data.portalRole
    account.portalAccessStatus = data.portalAccessStatus
    account.managedAgent = data.managedAgent
    account.managedOutletSlugs = data.managedOutletSlugs
  })
}

export async function assignArtistToAgent(accountId: string, artistAgent?: string) {
  if (getStorageDriver() === 'payload') {
    return updatePayloadAccount(accountId, { artistAgent: artistAgent?.trim() || undefined })
  }
  return updateFileAccount(accountId, (account) => {
    account.artistAgent = artistAgent?.trim() || undefined
  })
}

export async function getArtistAgentAssignments() {
  if (getStorageDriver() === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'users', where: { accountType: { equals: 'artist' } }, limit: 1000, depth: 0, pagination: false })
    return (result.docs as Array<Record<string, unknown>>).map(normalizePayloadUser).filter((account): account is SiteAccountRecord => Boolean(account?.artistProfileSlug))
  }
  return (await readFileStore()).accounts.filter((account) => Boolean(account.artistProfileSlug))
}

export async function getSiteStarBalanceSummary() {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'users',
      limit: 1000,
      depth: 0,
      pagination: false,
    })
    const users = (result.docs as Array<Record<string, unknown>>).filter((user) => user.accountType !== 'artist')
    return {
      userCount: users.length,
      totalBalance: users.reduce((total, user) => total + (typeof user.stars === 'number' ? user.stars : 0), 0),
      signupIssued: users.reduce((total, user) => total + (typeof user.signupStarsEarned === 'number' ? user.signupStarsEarned : 100), 0),
    }
  }

  const store = await readFileStore()
  const users = store.accounts.filter((account) => account.accountType === 'user')
  return {
    userCount: users.length,
    totalBalance: users.reduce((total, user) => total + user.stars, 0),
    signupIssued: users.reduce((total, user) => total + (user.signupStarsEarned ?? 100), 0),
  }
}

export async function getSiteSessionSnapshot(token?: string | null) {
  const authenticated = await getAuthenticatedSiteSession(token)
  if (!authenticated) {
    return buildAccessResult(null)
  }

  return buildAccessResult(authenticated.account)
}

export async function getAuthenticatedSiteSession(token?: string | null) {
  const session = await verifySiteSessionToken(token)
  if (!session) return null

  const account = await getSiteAccountById(session.userId)
  const invalidAfter = account?.sessionInvalidAfter ? new Date(account.sessionInvalidAfter).getTime() : 0
  if (!account || account.isActive === false || (Number.isFinite(invalidAfter) && session.issuedAt < invalidAfter)) {
    return null
  }

  return { session, account }
}

export async function loginSiteAccount(input: {
  identity: string
  password: string
  accountType?: SiteAccountType
}) {
  const accountType = input.accountType ?? 'user'
  const identity = input.identity.trim()
  const password = input.password.trim()

  if (!identity || !password) {
    return {
      ok: false as const,
      reason: 'invalid_credentials' as const,
    }
  }

  if (getStorageDriver() === 'payload') {
    await ensurePayloadSeedUsers()
    const payload = await loadPayloadClient()
    const lookup = await findPayloadAccountByIdentity(identity, accountType)

    if (!lookup?.email) {
      return {
        ok: false as const,
        reason: 'invalid_credentials' as const,
      }
    }

    try {
      await payload.login({
        collection: 'users',
        data: {
          email: lookup.email,
          password,
        },
      })
    } catch {
      return {
        ok: false as const,
        reason: 'invalid_credentials' as const,
      }
    }

    const freshAccount = await findPayloadAccountById(lookup.id)
    if (!freshAccount) {
      return {
        ok: false as const,
        reason: 'invalid_credentials' as const,
      }
    }

    const token = await createSiteSessionToken({
      userId: freshAccount.id,
      accountType: freshAccount.accountType,
    })

    return {
      ok: true as const,
      token,
      account: freshAccount,
    }
  }

  const store = await readFileStore()
  const account = findAccountByIdentity(store.accounts, identity, accountType)

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return {
      ok: false as const,
      reason: 'invalid_credentials' as const,
    }
  }

  const token = await createSiteSessionToken({
    userId: account.id,
    accountType: account.accountType,
  })

  return {
    ok: true as const,
    token,
    account,
  }
}

export async function upsertSocialSiteUser(profile: StoredUserProfile) {
  if (!profile.email) {
    return null
  }

  if (getStorageDriver() === 'payload') {
    await ensurePayloadSeedUsers()
    const payload = await loadPayloadClient()
    const email = normalizeIdentity(profile.email)
    const existing = await findPayloadAccountByIdentity(email, 'user')

    if (existing) {
      return updatePayloadAccount(existing.id, {
        socialProvider: profile.provider,
        fullName: profile.fullName?.trim() || existing.fullName,
      })
    }

    const created = await payload.create({
      collection: 'users',
      data: {
        email,
        password: randomUUID(),
        fullName: profile.fullName?.trim() || '9LIFE Member',
        accountType: 'user',
        role: 'customer',
        socialProvider: profile.provider,
        stars: SIGNUP_STARS,
        isActive: true,
      },
      depth: 0,
    })

    return normalizePayloadUser(created as Record<string, unknown>)
  }

  const email = normalizeIdentity(profile.email)
  const store = await readFileStore()
  const existing = findAccountByIdentity(store.accounts, email, 'user')

  if (existing) {
    existing.provider = profile.provider
    existing.email = email
    existing.fullName = profile.fullName?.trim() || existing.fullName
    existing.avatarUrl = profile.avatarUrl || existing.avatarUrl
    existing.updatedAt = new Date().toISOString()
    await writeFileStore(store)
    return existing
  }

  const now = new Date().toISOString()
  const account: SiteAccountRecord = {
    id: `user-${randomUUID()}`,
    accountType: 'user',
    provider: profile.provider,
    identity: email,
    email,
    fullName: profile.fullName?.trim() || '9LIFE Member',
    avatarUrl: profile.avatarUrl,
    passwordHash: hashPassword(randomUUID()),
    stars: SIGNUP_STARS,
    followedArtists: [],
    createdAt: now,
    updatedAt: now,
  }

  store.accounts.unshift(account)
  await writeFileStore(store)
  return account
}

export async function toggleFollowedArtistForUser(accountId: string, artistSlug: string) {
  if (getStorageDriver() === 'payload') {
    const current = await findPayloadAccountById(accountId)
    if (!current) return buildAccessResult(null, 'not_authenticated')

    const nextFollowed = current.followedArtists.includes(artistSlug)
      ? current.followedArtists.filter((item) => item !== artistSlug)
      : [...current.followedArtists, artistSlug]

    const account = await updatePayloadAccount(accountId, {
      followedArtistSlugs: mapFollowedArtistsToPayload(nextFollowed),
    })

    return buildAccessResult(account)
  }

  const account = await updateFileAccount(accountId, (current) => {
    current.followedArtists = current.followedArtists.includes(artistSlug)
      ? current.followedArtists.filter((item) => item !== artistSlug)
      : [...current.followedArtists, artistSlug]
  })

  return buildAccessResult(account)
}

export async function toggleFollowedAgentForUser(accountId: string, agentSlug: string) {
  if (getStorageDriver() === 'payload') {
    const current = await findPayloadAccountById(accountId)
    if (!current) return buildAccessResult(null, 'not_authenticated')

    const followedAgents = current.followedAgents ?? []
    const nextFollowed = followedAgents.includes(agentSlug)
      ? followedAgents.filter((item) => item !== agentSlug)
      : [...followedAgents, agentSlug]

    const account = await updatePayloadAccount(accountId, {
      followedAgentSlugs: mapFollowedArtistsToPayload(nextFollowed),
    })

    return buildAccessResult(account)
  }

  const account = await updateFileAccount(accountId, (current) => {
    const followedAgents = current.followedAgents ?? []
    current.followedAgents = followedAgents.includes(agentSlug)
      ? followedAgents.filter((item) => item !== agentSlug)
      : [...followedAgents, agentSlug]
  })

  return buildAccessResult(account)
}

export async function spendStarsForUser(
  accountId: string,
  amount: number,
  eventType: Extract<WalletEventType, 'spend_general' | 'spend_vote' | 'spend_playback' | 'spend_download'> = 'spend_general',
  options?: {
    reference?: string
    note?: string
    mediaAccess?: {
      trackId: string
      windowMs: number
    }
    premiumAccess?: {
      windowMs: number
    }
  },
) {
  const previous = walletLocks.get(accountId) ?? Promise.resolve()
  let release!: () => void
  const currentLock = new Promise<void>((resolve) => { release = resolve })
  const queuedLock = previous.then(() => currentLock)
  walletLocks.set(accountId, queuedLock)

  await previous
  try {
    const current = await getSiteAccountById(accountId)
    if (!current) return buildAccessResult(null, 'not_authenticated')

    if (options?.mediaAccess && (eventType === 'spend_playback' || eventType === 'spend_download')) {
      const alreadyCharged = await hasRecentMediaStarCharge(
        accountId,
        options.mediaAccess.trackId,
        eventType,
        options.mediaAccess.windowMs,
      )

      if (alreadyCharged) {
        return {
          ...buildAccessResult(current),
          alreadyCharged: true,
        }
      }
    }

    if (options?.premiumAccess) {
      const activeAccess = await getRecentPremiumAccess(accountId, options.premiumAccess.windowMs)
      if (activeAccess) {
        return {
          ...buildAccessResult(current),
          alreadyCharged: true,
          premiumAccess: activeAccess,
        }
      }
    }

    if (current.stars < amount) return buildAccessResult(current, 'insufficient_stars')

    const account =
      getStorageDriver() === 'payload'
        ? await updatePayloadAccount(accountId, {
            stars: Math.max(current.stars - amount, 0),
          })
        : await updateFileAccount(accountId, (record) => {
            record.stars = Math.max(record.stars - amount, 0)
          })

    if (account) {
      await recordWalletLedgerEntry({
        userId: accountId,
        amount: -Math.abs(amount),
        balanceAfter: account.stars,
        eventType,
        reference: options?.reference ?? `spend-${Date.now()}`,
        note: options?.note ?? 'Star spend from protected action',
      })
    }

    return buildAccessResult(account)
  } finally {
    release()
    if (walletLocks.get(accountId) === queuedLock) walletLocks.delete(accountId)
  }
}

export async function activatePremiumAccessForUser(accountId: string) {
  const windowMs = 24 * 60 * 60 * 1000
  const result = await spendStarsForUser(accountId, 10, 'spend_general', {
    reference: `premium-access:${accountId}:${randomUUID()}`,
    note: '24-hour Premium Drop access',
    premiumAccess: { windowMs },
  })
  const alreadyCharged = 'alreadyCharged' in result && result.alreadyCharged === true

  return {
    ...result,
    alreadyCharged,
    premiumAccess: result.ok ? await getRecentPremiumAccess(accountId, windowMs) : null,
  }
}

export async function accessMediaWithStars(
  accountId: string,
  trackId: string,
  kind: 'playback' | 'download',
  amount: number,
) {
  const eventType = kind === 'playback' ? 'spend_playback' : 'spend_download'

  return spendStarsForUser(accountId, amount, eventType, {
    reference: `media-access:${eventType}:${accountId}:${trackId}:${randomUUID()}`,
    note: `24-hour ${kind} access for ${trackId}`,
    mediaAccess: {
      trackId,
      windowMs: 24 * 60 * 60 * 1000,
    },
  })
}

export async function claimDailyStarsForUser(accountId: string) {
  const current = await getSiteAccountById(accountId)
  if (!current) return buildAccessResult(null, 'not_authenticated')
  if (!buildUserAccessStateFromAccount(current).canClaimDaily) return buildAccessResult(current, 'already_claimed')

  const nextDate = getTodayKey()
  const account =
    getStorageDriver() === 'payload'
      ? await updatePayloadAccount(accountId, {
          stars: current.stars + DAILY_STARS,
          dailyClaimDate: nextDate,
          dailyStarsEarned: (current.dailyStarsEarned ?? 0) + DAILY_STARS,
        })
      : await updateFileAccount(accountId, (record) => {
          record.stars += DAILY_STARS
          record.dailyClaimDate = nextDate
          record.dailyStarsEarned = (record.dailyStarsEarned ?? 0) + DAILY_STARS
        })

  if (account) {
    await recordWalletLedgerEntry({
      userId: accountId,
      amount: DAILY_STARS,
      balanceAfter: account.stars,
      eventType: 'daily_claim',
      reference: `daily-${accountId}-${nextDate}`,
      note: 'Daily star claim',
    })
  }

  return buildAccessResult(account)
}

export async function claimBonusStarsForUser(accountId: string) {
  const current = await getSiteAccountById(accountId)
  if (!current) return buildAccessResult(null, 'not_authenticated')
  if (!buildUserAccessStateFromAccount(current).canClaimBonus) return buildAccessResult(current, 'bonus_locked')

  const nextDate = getTodayKey()
  const account =
    getStorageDriver() === 'payload'
      ? await updatePayloadAccount(accountId, {
          stars: current.stars + BONUS_STARS,
          bonusClaimDate: nextDate,
          bonusStarsEarned: (current.bonusStarsEarned ?? 0) + BONUS_STARS,
        })
      : await updateFileAccount(accountId, (record) => {
          record.stars += BONUS_STARS
          record.bonusClaimDate = nextDate
          record.bonusStarsEarned = (record.bonusStarsEarned ?? 0) + BONUS_STARS
        })

  if (account) {
    await recordWalletLedgerEntry({
      userId: accountId,
      amount: BONUS_STARS,
      balanceAfter: account.stars,
      eventType: 'bonus_claim',
      reference: `bonus-${accountId}-${nextDate}`,
      note: 'Bonus star claim',
    })
  }

  return buildAccessResult(account)
}

export async function addStarsToSiteUser(accountId: string, stars: number) {
  const current = await getSiteAccountById(accountId)
  if (!current) return null

  return getStorageDriver() === 'payload'
    ? updatePayloadAccount(accountId, {
        stars: current.stars + Math.max(stars, 0),
      })
    : updateFileAccount(accountId, (record) => {
        record.stars += Math.max(stars, 0)
      })
}

// Called only by trusted server-side playlist aggregation after listens are verified.
export async function awardPlaylistStarsToUser(input: {
  accountId: string
  stars: number
  reference: string
  note?: string
}) {
  const stars = Math.max(0, Math.floor(input.stars))
  if (!stars) return null

  const current = await getSiteAccountById(input.accountId)
  if (!current) return null

  const account =
    getStorageDriver() === 'payload'
      ? await updatePayloadAccount(input.accountId, {
          stars: current.stars + stars,
          playlistStarsEarned: (current.playlistStarsEarned ?? 0) + stars,
        })
      : await updateFileAccount(input.accountId, (record) => {
          record.stars += stars
          record.playlistStarsEarned = (record.playlistStarsEarned ?? 0) + stars
        })

  if (account) {
    await recordWalletLedgerEntry({
      userId: input.accountId,
      amount: stars,
      balanceAfter: account.stars,
      eventType: 'playlist_reward',
      reference: input.reference,
      note: input.note ?? 'Verified playlist reward',
    })
  }

  return account
}

// Called by the referral service only after an independent visitor qualifies.
export async function awardShareStarsToUser(input: { accountId: string; reference: string }) {
  const stars = 10
  const current = await getSiteAccountById(input.accountId)
  if (!current) return null

  const account = getStorageDriver() === 'payload'
    ? await updatePayloadAccount(input.accountId, {
        stars: current.stars + stars,
        shareStarsEarned: (current.shareStarsEarned ?? 0) + stars,
      })
    : await updateFileAccount(input.accountId, (record) => {
        record.stars += stars
        record.shareStarsEarned = (record.shareStarsEarned ?? 0) + stars
      })

  if (account) {
    await recordWalletLedgerEntry({
      userId: input.accountId,
      amount: stars,
      balanceAfter: account.stars,
      eventType: 'share_reward',
      reference: input.reference,
      note: 'Verified referral share reward',
    })
  }

  return account
}

export async function setAccountPasswordByIdentity(input: {
  identity: string
  accountType: SiteAccountType
  password: string
}) {
  const account = await findSiteAccountByIdentity(input.identity, input.accountType)
  if (!account) return null

  if (getStorageDriver() === 'payload') {
    return updatePayloadAccount(account.id, {
      password: input.password,
      sessionInvalidAfter: new Date().toISOString(),
    })
  }

  return updateFileAccount(account.id, (record) => {
    record.passwordHash = hashPassword(input.password)
    record.sessionInvalidAfter = new Date().toISOString()
  })
}
