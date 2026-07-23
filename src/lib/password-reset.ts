import 'server-only'

import { createHash, randomBytes, randomInt } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { getPasswordResetMailConfig } from '@/lib/auth-config'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { findSiteAccountByIdentity, setAccountPasswordByIdentity } from '@/lib/site-user-session'

const RESET_STORE_PATH = path.join(process.cwd(), 'data', 'password-reset-tokens.json')
const RESET_EXPIRY_HOURS = 24
const TOKEN_PREFIX = 'link:'
const OTP_PREFIX = 'otp:'
const TELEGRAM_PREFIX = 'telegram:'

type AccountType = 'user' | 'artist'
type DeliveryMethod = 'email' | 'telegram'

type ResetTokenRecord = {
  tokenHash: string
  identity: string
  accountType: AccountType
  createdAt: string
  expiresAt: string
  usedAt?: string
}

type ResetStore = {
  tokens: ResetTokenRecord[]
}

type PayloadResetToken = {
  id: string
  tokenHash?: string
  identity?: string
  accountType?: AccountType
  expiresAt?: string
  usedAt?: string
}

function emptyStore(): ResetStore {
  return { tokens: [] }
}

async function readStore() {
  try {
    const content = await fs.readFile(RESET_STORE_PATH, 'utf8')
    const parsed = JSON.parse(content) as ResetStore
    return { tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [] }
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: ResetStore) {
  await fs.mkdir(path.dirname(RESET_STORE_PATH), { recursive: true })
  await fs.writeFile(RESET_STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function getBaseUrl() {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
}

function normalizeIdentity(identity: string) {
  return identity.trim().toLowerCase()
}

function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function linkHash(token: string) {
  return `${TOKEN_PREFIX}${hashValue(token)}`
}

function otpHash(identity: string, accountType: AccountType, otp: string) {
  return `${OTP_PREFIX}${hashValue(`${normalizeIdentity(identity)}:${accountType}:${otp.trim()}`)}`
}

function telegramCodeHash(code: string) {
  return `${TELEGRAM_PREFIX}${hashValue(code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}`
}

function isValidRecord(record: PayloadResetToken | ResetTokenRecord | null | undefined) {
  return Boolean(
    record?.identity &&
      record.accountType &&
      record.expiresAt &&
      !record.usedAt &&
      new Date(record.expiresAt).getTime() >= Date.now()
  )
}

async function findResetRecord(tokenHash: string) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'password-reset-tokens',
      where: { tokenHash: { equals: tokenHash } },
      limit: 1,
      depth: 0,
      pagination: false,
    })
    return (result.docs[0] as PayloadResetToken | undefined) ?? null
  }

  const store = await readStore()
  return store.tokens.find((item) => item.tokenHash === tokenHash) ?? null
}

async function invalidateIdentityRecords(identity: string) {
  const normalized = normalizeIdentity(identity)
  const usedAt = new Date().toISOString()

  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const previous = await payload.find({
      collection: 'password-reset-tokens',
      where: { identity: { equals: normalized } },
      limit: 100,
      depth: 0,
      pagination: false,
    })
    await Promise.all(
      (previous.docs as PayloadResetToken[])
        .filter((item) => !item.usedAt)
        .map((item) =>
          payload.update({
            collection: 'password-reset-tokens',
            id: item.id,
            data: { usedAt },
          })
        )
    )
    return
  }

  const store = await readStore()
  for (const item of store.tokens) {
    if (item.identity === normalized && !item.usedAt) item.usedAt = usedAt
  }
  await writeStore(store)
}

async function createResetRecords(records: ResetTokenRecord[]) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await Promise.all(
      records.map((record) =>
        payload.create({
          collection: 'password-reset-tokens',
          data: {
            tokenHash: record.tokenHash,
            identity: record.identity,
            accountType: record.accountType,
            expiresAt: record.expiresAt,
          },
        })
      )
    )
    return
  }

  const store = await readStore()
  await writeStore({ tokens: [...records, ...store.tokens].slice(0, 400) })
}

async function consumeIdentityRecords(identity: string) {
  await invalidateIdentityRecords(identity)
}

function createResetUrl(rawToken: string, accountType: AccountType) {
  return `${getBaseUrl()}/tai-khoan/dat-lai-mat-khau?token=${encodeURIComponent(rawToken)}&type=${accountType}`
}

async function issueResetCredentials(identity: string, accountType: AccountType) {
  const normalized = normalizeIdentity(identity)
  const rawToken = randomBytes(32).toString('base64url')
  const otp = String(randomInt(10_000_000, 100_000_000))
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESET_EXPIRY_HOURS * 60 * 60 * 1000)

  await invalidateIdentityRecords(normalized)
  await createResetRecords([
    {
      tokenHash: linkHash(rawToken),
      identity: normalized,
      accountType,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
    {
      tokenHash: otpHash(normalized, accountType, otp),
      identity: normalized,
      accountType,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  ])

  return {
    otp,
    resetUrl: createResetUrl(rawToken, accountType),
    expiresAt: expiresAt.toISOString(),
  }
}

async function createTelegramRecoveryCode(identity: string, accountType: AccountType) {
  const normalized = normalizeIdentity(identity)
  const raw = randomBytes(8).toString('hex').toUpperCase()
  const recoveryCode = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESET_EXPIRY_HOURS * 60 * 60 * 1000)

  await invalidateIdentityRecords(normalized)
  await createResetRecords([
    {
      tokenHash: telegramCodeHash(recoveryCode),
      identity: normalized,
      accountType,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  ])

  return recoveryCode
}

async function sendResetEmail(input: {
  to: string
  resetUrl: string
  otp: string
  accountType: AccountType
}) {
  const mailConfig = await getPasswordResetMailConfig()
  const fromEmail = env.RESET_PASSWORD_FROM_EMAIL?.trim() || mailConfig?.fromEmail
  const fromName = env.RESET_PASSWORD_FROM_NAME?.trim() || mailConfig?.fromName || '9LIFE MAG'
  const cloudflareAccountId = env.CLOUDFLARE_ACCOUNT_ID?.trim() || env.R2_ACCOUNT_ID?.trim()
  const cloudflareToken = env.CLOUDFLARE_EMAIL_API_TOKEN?.trim()
  if (!fromEmail || (!cloudflareToken && !mailConfig)) return false

  const subject =
    input.accountType === 'artist'
      ? 'Khôi phục mật khẩu cổng nghệ sĩ 9LIFE MAG'
      : 'Khôi phục mật khẩu tài khoản 9LIFE MAG'
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.65;color:#111;max-width:620px;margin:auto">
      <h2>Khôi phục mật khẩu 9LIFE MAG</h2>
      <p>Mã xác minh của bạn:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:5px">${input.otp}</p>
      <p>Hoặc mở liên kết bảo mật sau để đặt lại mật khẩu:</p>
      <p><a href="${input.resetUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Đặt lại mật khẩu</a></p>
      <p>Mã và liên kết có hiệu lực trong ${RESET_EXPIRY_HOURS} giờ, chỉ dùng một lần.</p>
      <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email và không chia sẻ mã cho bất kỳ ai.</p>
    </div>
  `

  if (cloudflareAccountId && cloudflareToken) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cloudflareToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { address: fromEmail, name: fromName },
          to: input.to,
          subject,
          html,
          text: `OTP: ${input.otp}\nLink đặt lại mật khẩu: ${input.resetUrl}\nCó hiệu lực trong 24 giờ.`,
        }),
        cache: 'no-store',
      }
    )
    return response.ok
  }

  if (!mailConfig) return false
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mailConfig.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${mailConfig.fromName} <${mailConfig.fromEmail}>`,
      to: [input.to],
      subject,
      html,
    }),
    cache: 'no-store',
  })

  return response.ok
}

export async function requestPasswordReset(input: {
  identity: string
  accountType: AccountType
  method?: DeliveryMethod
}) {
  const identity = normalizeIdentity(input.identity)
  // Email delivery is intentionally paused; recovery is handled only by Telegram.
  const method = 'telegram' as DeliveryMethod
  const account = await findSiteAccountByIdentity(identity, input.accountType)

  if (!account) {
    return {
      ok: true,
      message: 'Nếu tài khoản tồn tại, hệ thống đã tạo hướng dẫn khôi phục phù hợp.',
      recoveryCode:
        method === 'telegram'
          ? `${randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') ?? ''}`
          : '',
    }
  }

  if (method === 'telegram') {
    const recoveryCode = await createTelegramRecoveryCode(identity, input.accountType)
    const botUsername = env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '')
    return {
      ok: true,
      message: 'Mã khôi phục đã được tạo. Gửi mã này cho bot Telegram 9LIFE trong vòng 24 giờ.',
      recoveryCode,
      telegramUrl: botUsername
        ? `https://t.me/${botUsername}?start=reset_${recoveryCode.replace(/-/g, '')}`
        : '',
    }
  }

  const destinationEmail = account.email
  if (!destinationEmail) {
    return {
      ok: true,
      message: 'Tài khoản này chưa có email. Vui lòng chọn khôi phục qua Telegram.',
      requiresTelegram: true,
    }
  }

  const credentials = await issueResetCredentials(identity, input.accountType)
  const sent = await sendResetEmail({
    to: destinationEmail,
    resetUrl: credentials.resetUrl,
    otp: credentials.otp,
    accountType: input.accountType,
  })

  return {
    ok: true,
    message: sent
      ? 'OTP và link đặt lại mật khẩu đã được gửi qua email. Cả hai có hiệu lực trong 24 giờ.'
      : 'Dịch vụ email chưa sẵn sàng. Vui lòng dùng phương án khôi phục qua Telegram.',
    previewUrl: process.env.NODE_ENV === 'production' ? '' : credentials.resetUrl,
    requiresTelegram: !sent,
  }
}

export async function redeemTelegramRecoveryCode(code: string) {
  const record = await findResetRecord(telegramCodeHash(code))
  if (!isValidRecord(record) || !record?.identity || !record.accountType) {
    return { ok: false as const }
  }

  const credentials = await issueResetCredentials(record.identity, record.accountType)
  return {
    ok: true as const,
    accountType: record.accountType,
    otp: credentials.otp,
    resetUrl: credentials.resetUrl,
    expiresAt: credentials.expiresAt,
  }
}

export async function validatePasswordResetToken(token: string) {
  const record = await findResetRecord(linkHash(token))
  if (!isValidRecord(record) || !record?.identity || !record.accountType) {
    return { ok: false as const, message: 'Link đặt lại mật khẩu không còn hợp lệ.' }
  }
  return { ok: true as const, accountType: record.accountType, identity: record.identity }
}

export async function completePasswordReset(input: {
  token?: string
  identity?: string
  accountType?: AccountType
  otp?: string
  password: string
}) {
  const record = input.token
    ? await findResetRecord(linkHash(input.token))
    : input.identity && input.accountType && input.otp
      ? await findResetRecord(otpHash(input.identity, input.accountType, input.otp))
      : null

  if (!isValidRecord(record) || !record?.identity || !record.accountType) {
    return { ok: false, message: 'OTP hoặc link đặt lại mật khẩu không còn hợp lệ.' }
  }

  const account = await setAccountPasswordByIdentity({
    identity: record.identity,
    accountType: record.accountType,
    password: input.password,
  })

  if (!account) {
    return { ok: false, message: 'Không tìm thấy tài khoản tương ứng để cập nhật mật khẩu.' }
  }

  await consumeIdentityRecords(record.identity)
  return {
    ok: true,
    message: 'Đã cập nhật mật khẩu mới. Bạn có thể quay lại màn hình đăng nhập.',
    accountType: record.accountType,
    identity: record.identity,
  }
}
