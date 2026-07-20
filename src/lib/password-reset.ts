import 'server-only'

import { createHash, randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { getPasswordResetMailConfig } from '@/lib/auth-config'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { findSiteAccountByIdentity, setAccountPasswordByIdentity } from '@/lib/site-user-session'

const RESET_STORE_PATH = path.join(process.cwd(), 'data', 'password-reset-tokens.json')
const RESET_EXPIRY_MINUTES = 30

type AccountType = 'user' | 'artist'

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
  return {
    tokens: [],
  }
}

async function readStore() {
  try {
    const content = await fs.readFile(RESET_STORE_PATH, 'utf8')
    const parsed = JSON.parse(content) as ResetStore
    return {
      tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
    }
  } catch {
    return emptyStore()
  }
}

async function writeStore(store: ResetStore) {
  await fs.mkdir(path.dirname(RESET_STORE_PATH), { recursive: true })
  await fs.writeFile(RESET_STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

async function findPayloadResetToken(tokenHash: string) {
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

function getBaseUrl() {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
}

function normalizeIdentity(identity: string) {
  return identity.trim().toLowerCase()
}

function isEmailIdentity(identity: string) {
  return identity.includes('@')
}

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function sendResetEmail(input: {
  to: string
  resetUrl: string
  accountType: AccountType
}) {
  const mailConfig = await getPasswordResetMailConfig()
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
      subject:
        input.accountType === 'artist'
          ? 'Đặt lại mật khẩu cổng nghệ sĩ 9LIFE MAG'
          : 'Đặt lại mật khẩu tài khoản 9LIFE MAG',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Khôi phục mật khẩu</h2>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${input.accountType === 'artist' ? 'nghệ sĩ' : 'user'}.</p>
          <p>Nhấn vào liên kết bên dưới để tiếp tục:</p>
          <p><a href="${input.resetUrl}">${input.resetUrl}</a></p>
          <p>Liên kết có hiệu lực trong ${RESET_EXPIRY_MINUTES} phút.</p>
        </div>
      `,
    }),
    cache: 'no-store',
  })

  return response.ok
}

async function hasAccount(identity: string, accountType: AccountType) {
  const account = await findSiteAccountByIdentity(identity, accountType)
  return Boolean(account)
}

export async function requestPasswordReset(input: {
  identity: string
  accountType: AccountType
}) {
  const identity = normalizeIdentity(input.identity)

  if (!(await hasAccount(identity, input.accountType))) {
    return {
      ok: true,
      message: 'Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu hoặc cung cấp link kiểm thử trong môi trường setup.',
      previewUrl: '',
    }
  }

  const rawToken = randomUUID()
  const tokenHash = hashResetToken(rawToken)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESET_EXPIRY_MINUTES * 60 * 1000)
  const nextRecord: ResetTokenRecord = {
    tokenHash,
    identity,
    accountType: input.accountType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const previous = await payload.find({ collection: 'password-reset-tokens', where: { identity: { equals: identity } }, limit: 100, depth: 0, pagination: false })
    await Promise.all((previous.docs as PayloadResetToken[]).filter((item) => !item.usedAt).map((item) => payload.update({ collection: 'password-reset-tokens', id: item.id, data: { usedAt: now.toISOString() } })))
    await payload.create({ collection: 'password-reset-tokens', data: { tokenHash, identity, accountType: input.accountType, expiresAt: expiresAt.toISOString() } })
  } else {
    const store = await readStore()
    const activeTokens = store.tokens.filter((item) => item.identity !== identity || item.usedAt)
    await writeStore({
      tokens: [nextRecord, ...activeTokens].slice(0, 200),
    })
  }

  const resetUrl = `${getBaseUrl()}/tai-khoan/dat-lai-mat-khau?token=${encodeURIComponent(rawToken)}&type=${input.accountType}`

  if (isEmailIdentity(identity)) {
    const sent = await sendResetEmail({
      to: identity,
      resetUrl,
      accountType: input.accountType,
    })

    if (sent) {
      return {
        ok: true,
        message: 'Chúng tôi đã gửi link đặt lại mật khẩu vào email của bạn.',
        previewUrl: '',
      }
    }
  }

  return {
    ok: true,
    message: 'Email reset chưa được cấu hình hoàn chỉnh hoặc bạn dùng số điện thoại. Bạn có thể mở link khôi phục bên dưới để kiểm thử luồng ngay trong giai đoạn setup.',
    previewUrl: process.env.NODE_ENV === 'production' ? '' : resetUrl,
  }
}

export async function validatePasswordResetToken(token: string) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const record = await findPayloadResetToken(hashResetToken(token))
    if (!record?.identity || !record.accountType || !record.expiresAt || record.usedAt || new Date(record.expiresAt).getTime() < Date.now()) {
      return { ok: false as const, message: 'Link đặt lại mật khẩu không còn hợp lệ.' }
    }
    return { ok: true as const, accountType: record.accountType, identity: record.identity }
  }

  const store = await readStore()
  const tokenHash = hashResetToken(token)
  const record = store.tokens.find((item) => item.tokenHash === tokenHash)

  if (!record) {
    return {
      ok: false as const,
      message: 'Link đặt lại mật khẩu không còn hợp lệ.',
    }
  }

  if (record.usedAt) {
    return {
      ok: false as const,
      message: 'Link này đã được sử dụng rồi.',
    }
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return {
      ok: false as const,
      message: 'Link đặt lại mật khẩu đã hết hạn.',
    }
  }

  return {
    ok: true as const,
    accountType: record.accountType,
    identity: record.identity,
  }
}

export async function completePasswordReset(input: { token: string; password: string }) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const record = await findPayloadResetToken(hashResetToken(input.token))
    if (!record?.identity || !record.accountType || !record.expiresAt || record.usedAt || new Date(record.expiresAt).getTime() < Date.now()) {
      return { ok: false, message: 'Link đặt lại mật khẩu không còn hợp lệ.' }
    }
    const account = await setAccountPasswordByIdentity({ identity: record.identity, accountType: record.accountType, password: input.password })
    if (!account) return { ok: false, message: 'Không tìm thấy tài khoản tương ứng để cập nhật mật khẩu mới.' }
    const payload = await loadPayloadClient()
    await payload.update({ collection: 'password-reset-tokens', id: record.id, data: { usedAt: new Date().toISOString() } })
    return { ok: true, message: 'Đã cập nhật mật khẩu mới thành công. Bạn có thể quay lại màn hình đăng nhập.', accountType: record.accountType, identity: record.identity }
  }

  const store = await readStore()
  const tokenHash = hashResetToken(input.token)
  const record = store.tokens.find((item) => item.tokenHash === tokenHash)

  if (!record) {
    return {
      ok: false,
      message: 'Link đặt lại mật khẩu không còn hợp lệ.',
    }
  }

  if (record.usedAt) {
    return {
      ok: false,
      message: 'Link này đã được sử dụng rồi.',
    }
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return {
      ok: false,
      message: 'Link đặt lại mật khẩu đã hết hạn.',
    }
  }

  const account = await setAccountPasswordByIdentity({
    identity: record.identity,
    accountType: record.accountType,
    password: input.password,
  })

  if (!account) {
    return {
      ok: false,
      message: 'Không tìm thấy tài khoản tương ứng để cập nhật mật khẩu mới.',
    }
  }

  record.usedAt = new Date().toISOString()
  await writeStore(store)

  return {
    ok: true,
    message: 'Đã cập nhật mật khẩu mới thành công. Bạn có thể quay lại màn hình đăng nhập.',
    accountType: record.accountType,
    identity: record.identity,
  }
}
