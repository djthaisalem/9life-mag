import 'server-only'

import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { cmsUserRows } from '@/lib/cms-dashboard-data'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { getPaymentGatewayConfig } from '@/lib/payment-config'
import { addStarsToSiteUser, getSiteAccountById } from '@/lib/site-user-session'
import {
  paymentProviders,
  starPackages,
  type PaymentProviderId,
  type StarTopupRequest,
} from '@/lib/star-payment-shared'
import { sendTelegramPaymentNotice } from '@/lib/telegram'
import { recordWalletLedgerEntry } from '@/lib/wallet-ledger'

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'cms-star-topups.json')

type StoreShape = {
  balances: Record<string, number>
  requests: StarTopupRequest[]
}

const reviewLocks = new Map<string, Promise<void>>()

async function withTopupReviewLock<T>(requestId: string, operation: () => Promise<T>) {
  const previous = reviewLocks.get(requestId) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.then(() => current)
  reviewLocks.set(requestId, queued)

  await previous
  try {
    return await operation()
  } finally {
    release()
    if (reviewLocks.get(requestId) === queued) reviewLocks.delete(requestId)
  }
}

function parseUserStars(value: string) {
  const digits = value.match(/\d+/)
  return digits ? Number(digits[0]) : 0
}

async function ensureStore(): Promise<StoreShape> {
  try {
    const content = await fs.readFile(STORE_PATH, 'utf8')
    return JSON.parse(content) as StoreShape
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const initial: StoreShape = {
      balances: Object.fromEntries(cmsUserRows.map((user) => [user.id, parseUserStars(user.stars)])),
      requests: [],
    }
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
}

async function saveStore(store: StoreShape) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('vi-VN')
}

function buildTransactionRef() {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const random = randomBytes(6).toString('hex').toUpperCase()
  return `STAR-${stamp}-${random}`
}

function buildProviderOrderId(provider: PaymentProviderId, transactionRef: string) {
  const prefix: Record<PaymentProviderId, string> = {
    bank_qr: 'VQR',
    momo: 'MOMO',
    viettel_money: 'VTM',
    paypal: 'PP',
  }
  return `${prefix[provider]}-${transactionRef.replace(/^STAR-/, '')}`
}

async function transactionRefExists(transactionRef: string) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const existing = await payload.find({
      collection: 'star-topups',
      where: { transactionRef: { equals: transactionRef } },
      limit: 1,
      depth: 0,
      pagination: false,
    })
    return existing.docs.length > 0
  }

  const store = await ensureStore()
  return store.requests.some((request) => request.transactionRef === transactionRef)
}

async function buildUniqueTransactionRef() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const transactionRef = buildTransactionRef()
    if (!(await transactionRefExists(transactionRef))) return transactionRef
  }
  throw new Error('transaction-reference-generation-failed')
}

function buildBankQrUrl(input: {
  bankCode: string
  accountNumber: string
  accountName: string
  amount: number
  addInfo: string
  template: string
}) {
  if (!input.bankCode || !input.accountNumber) return ''

  const params = new URLSearchParams({
    amount: String(input.amount),
    addInfo: input.addInfo,
    accountName: input.accountName,
  })

  return `https://img.vietqr.io/image/${input.bankCode}-${input.accountNumber}-${input.template}.png?${params.toString()}`
}

function hasBankQrConfig(input: {
  bankCode: string
  accountNumber: string
  accountName: string
}) {
  return Boolean(input.bankCode.trim() && input.accountNumber.trim() && input.accountName.trim())
}

function providerConfigMissing(provider: PaymentProviderId) {
  return new Error(`payment-provider-config-missing:${provider}`)
}

async function buildProviderArtifact(input: {
  provider: PaymentProviderId
  amount: number
  stars: number
  transactionRef: string
  packageTitle: string
}) {
  const config = await getPaymentGatewayConfig()
  const providerOrderId = buildProviderOrderId(input.provider, input.transactionRef)

  switch (input.provider) {
    case 'bank_qr': {
      if (!hasBankQrConfig(config)) {
        throw new Error('bank-qr-config-missing')
      }

      const qrUrl = buildBankQrUrl({
        bankCode: config.bankCode,
        accountNumber: config.accountNumber,
        accountName: config.accountName,
        amount: input.amount,
        addInfo: input.transactionRef,
        template: config.qrTemplate || 'compact2',
      })

      return {
        qrUrl,
        actionUrl: '',
        providerOrderId,
        providerMessage: `Quét VietQR để chuyển ${formatCurrency(input.amount)} VND vào ${config.bankName || 'tài khoản đã cấu hình'} - ${config.accountName}. Nội dung bắt buộc: ${input.transactionRef}.`,
      }
    }
    case 'momo': {
      if (!config.momoPartnerCode || !config.momoAccessKey || !config.momoSecretKey || !config.momoEndpoint) throw providerConfigMissing('momo')
      return {
        qrUrl: '',
        actionUrl: '',
        providerOrderId,
        providerMessage: `Đã tạo payment intent MoMo ${providerOrderId}. Chế độ ${config.processingMode}: giao dịch chỉ chờ đối soát, chưa tự gọi API hoặc cộng sao.`,
      }
    }
    case 'viettel_money': {
      if (!config.viettelMerchantId || !config.viettelSecretKey || !config.viettelEndpoint) throw providerConfigMissing('viettel_money')
      return {
        qrUrl: '',
        actionUrl: '',
        providerOrderId,
        providerMessage: `Đã tạo payment intent Viettel Money ${providerOrderId}. Chế độ ${config.processingMode}: giao dịch chỉ chờ đối soát, chưa tự gọi API hoặc cộng sao.`,
      }
    }
    case 'paypal': {
      if (!config.paypalClientId || !config.paypalSecretKey || !config.paypalBaseUrl) throw providerConfigMissing('paypal')
      return {
        qrUrl: '',
        actionUrl: '',
        providerOrderId,
        providerMessage: `Đã tạo payment intent PayPal ${providerOrderId}. Chế độ ${config.processingMode}: giao dịch chỉ chờ đối soát, chưa tự gọi API hoặc cộng sao.`,
      }
    }
  }
}

function buildUserNotice(status: 'pending' | 'approved' | 'rejected', stars: number) {
  if (status === 'approved') {
    return `Yêu cầu đã được duyệt. Tài khoản đã được cộng ${stars} sao.`
  }

  if (status === 'rejected') {
    return 'Yêu cầu nạp sao chưa được chấp nhận. Vui lòng kiểm tra lại thông tin thanh toán hoặc liên hệ hỗ trợ.'
  }

  return 'Yêu cầu đang chờ đội vận hành đối soát thủ công.'
}

async function readPayloadSnapshot() {
  const payload = await loadPayloadClient()
  const [topups, users] = await Promise.all([
    payload.find({
      collection: 'star-topups',
      sort: '-createdAt',
      limit: 200,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'users',
      limit: 100,
      depth: 0,
      pagination: false,
    }),
  ])

  const balances = Object.fromEntries(
    (users.docs as Array<Record<string, unknown>>).map((user) => [String(user.id), typeof user.stars === 'number' ? user.stars : 0]),
  )

  const requests = (topups.docs as Array<Record<string, unknown>>).map<StarTopupRequest>((doc) => ({
    id: String(doc.id),
    transactionRef: String(doc.transactionRef ?? ''),
    providerOrderId: typeof doc.providerOrderId === 'string' ? doc.providerOrderId : '',
    userId: String(doc.siteUserId ?? ''),
    userName: String(doc.userName ?? ''),
    userEmail: String(doc.userEmail ?? ''),
    packageId: String(doc.packageId ?? ''),
    packageTitle: String(doc.packageTitle ?? ''),
    provider: (doc.provider as PaymentProviderId) ?? 'bank_qr',
    amount: typeof doc.amount === 'number' ? doc.amount : 0,
    stars: typeof doc.stars === 'number' ? doc.stars : 0,
    status: (doc.status as StarTopupRequest['status']) ?? 'pending',
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
    reviewedAt: typeof doc.reviewedAt === 'string' ? doc.reviewedAt : undefined,
    note: typeof doc.note === 'string' ? doc.note : '',
    qrUrl: typeof doc.qrUrl === 'string' ? doc.qrUrl : '',
    actionUrl: typeof doc.actionUrl === 'string' ? doc.actionUrl : '',
    providerMessage: typeof doc.providerMessage === 'string' ? doc.providerMessage : '',
    userNotice: typeof doc.userNotice === 'string' ? doc.userNotice : '',
  }))

  return {
    balances,
    requests,
  }
}

export async function getStarTopupSnapshot() {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    return readPayloadSnapshot()
  }

  const store = await ensureStore()

  return {
    balances: store.balances,
    requests: [...store.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export async function createStarTopupRequest(input: {
  userId: string
  packageId: string
  provider: PaymentProviderId
  note?: string
}) {
  const cmsUser = cmsUserRows.find((item) => item.id === input.userId)
  const siteUser = cmsUser ? null : await getSiteAccountById(input.userId)
  const user = cmsUser
    ? {
        id: cmsUser.id,
        name: cmsUser.name,
        email: cmsUser.email,
      }
    : siteUser
      ? {
          id: siteUser.id,
          name: siteUser.fullName,
          email: siteUser.email ?? siteUser.identity,
        }
      : null
  const selectedPackage = starPackages.find((item) => item.id === input.packageId)

  if (!user || !selectedPackage) {
    throw new Error('invalid-topup-input')
  }

  const transactionRef = await buildUniqueTransactionRef()
  const providerArtifact = await buildProviderArtifact({
    provider: input.provider,
    amount: selectedPackage.amount,
    stars: selectedPackage.stars,
    transactionRef,
    packageTitle: selectedPackage.title,
  })

  const request: StarTopupRequest = {
    id: `topup-${transactionRef.toLowerCase()}`,
    transactionRef,
    providerOrderId: providerArtifact.providerOrderId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    packageId: selectedPackage.id,
    packageTitle: selectedPackage.title,
    provider: input.provider,
    amount: selectedPackage.amount,
    stars: selectedPackage.stars,
    status: 'pending',
    createdAt: new Date().toISOString(),
    note: input.note?.trim() || '',
    qrUrl: providerArtifact.qrUrl,
    actionUrl: providerArtifact.actionUrl,
    providerMessage: providerArtifact.providerMessage,
    userNotice: buildUserNotice('pending', selectedPackage.stars),
  }

  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await payload.create({
      collection: 'star-topups',
      data: {
        transactionRef: request.transactionRef,
        providerOrderId: request.providerOrderId,
        user: request.userId,
        siteUserId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        packageId: request.packageId,
        packageTitle: request.packageTitle,
        provider: request.provider,
        amount: request.amount,
        stars: request.stars,
        status: request.status,
        note: request.note,
        qrUrl: request.qrUrl,
        actionUrl: request.actionUrl,
        providerMessage: request.providerMessage,
        userNotice: request.userNotice,
      },
    })
  } else {
    const store = await ensureStore()
    store.requests.unshift(request)
    await saveStore(store)
  }

  await sendTelegramPaymentNotice(
    [
      '9LIFE MAG - TOPUP REQUEST',
      `User: ${request.userName} (${request.userEmail})`,
      `Gói: ${request.packageTitle}`,
      `Provider: ${request.provider}`,
      `Mã provider: ${request.providerOrderId}`,
      `Số tiền: ${formatCurrency(request.amount)} VND`,
      `Số sao: ${request.stars}`,
      `Mã đối soát: ${request.transactionRef}`,
    ].join('\n')
  )

  return getStarTopupSnapshot()
}

async function reviewStarTopupRequestUnsafe(input: {
  requestId: string
  decision: 'approved' | 'rejected'
  note?: string
}) {
  let request: StarTopupRequest | null = null

  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const existing = await payload.findByID({
      collection: 'star-topups',
      id: input.requestId,
      depth: 0,
    })

    request = {
      id: String(existing.id),
      transactionRef: String(existing.transactionRef ?? ''),
      providerOrderId: typeof existing.providerOrderId === 'string' ? existing.providerOrderId : '',
      userId: String(existing.siteUserId ?? ''),
      userName: String(existing.userName ?? ''),
      userEmail: String(existing.userEmail ?? ''),
      packageId: String(existing.packageId ?? ''),
      packageTitle: String(existing.packageTitle ?? ''),
      provider: (existing.provider as PaymentProviderId) ?? 'bank_qr',
      amount: typeof existing.amount === 'number' ? existing.amount : 0,
      stars: typeof existing.stars === 'number' ? existing.stars : 0,
      status: (existing.status as StarTopupRequest['status']) ?? 'pending',
      createdAt: typeof existing.createdAt === 'string' ? existing.createdAt : new Date().toISOString(),
      reviewedAt: typeof existing.reviewedAt === 'string' ? existing.reviewedAt : undefined,
      note: typeof existing.note === 'string' ? existing.note : '',
      qrUrl: typeof existing.qrUrl === 'string' ? existing.qrUrl : '',
      actionUrl: typeof existing.actionUrl === 'string' ? existing.actionUrl : '',
      providerMessage: typeof existing.providerMessage === 'string' ? existing.providerMessage : '',
      userNotice: typeof existing.userNotice === 'string' ? existing.userNotice : '',
    }

    if (request.status !== 'pending') {
      return getStarTopupSnapshot()
    }

    request.status = input.decision
    request.reviewedAt = new Date().toISOString()
    request.note = input.note?.trim() || request.note
    request.userNotice = buildUserNotice(input.decision, request.stars)

    await payload.update({
      collection: 'star-topups',
      id: request.id,
      data: {
        status: request.status,
        reviewedAt: request.reviewedAt,
        note: request.note,
        userNotice: request.userNotice,
      },
    })
  } else {
    const store = await ensureStore()
    request = store.requests.find((item) => item.id === input.requestId) ?? null

    if (!request) {
      throw new Error('request-not-found')
    }

    if (request.status !== 'pending') {
      return getStarTopupSnapshot()
    }

    request.status = input.decision
    request.reviewedAt = new Date().toISOString()
    request.note = input.note?.trim() || request.note
    request.userNotice = buildUserNotice(input.decision, request.stars)
    await saveStore(store)
  }

  if (!request) {
    throw new Error('request-not-found')
  }

  if (input.decision === 'approved') {
    const updatedAccount = await addStarsToSiteUser(request.userId, request.stars)

    if (updatedAccount) {
      await recordWalletLedgerEntry({
        userId: request.userId,
        amount: request.stars,
        balanceAfter: updatedAccount.stars,
        eventType: 'topup_approved',
        reference: request.transactionRef,
        note: request.packageTitle,
      })
    }
  }

  await sendTelegramPaymentNotice(
    [
      '9LIFE MAG - TOPUP REVIEW',
      `User: ${request.userName}`,
      `Mã đối soát: ${request.transactionRef}`,
      `Kết quả: ${input.decision === 'approved' ? 'CHẤP NHẬN' : 'TỪ CHỐI'}`,
      input.decision === 'approved'
        ? `Đã cộng ${request.stars} sao vào tài khoản.`
        : 'Yêu cầu đã bị từ chối và đang chờ user cập nhật lại thông tin.',
    ].join('\n')
  )

  return getStarTopupSnapshot()
}

export async function reviewStarTopupRequest(input: {
  requestId: string
  decision: 'approved' | 'rejected'
  note?: string
}) {
  return withTopupReviewLock(input.requestId, () => reviewStarTopupRequestUnsafe(input))
}
