import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { cmsTelegramBookingConfig } from '@/lib/cms-dashboard-data'
import { assertRuntimeConfigurationWritable, assertSafeConfigurationValues } from '@/lib/config-input-security'

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local')
const CONFIG_STORE_PATH = path.join(process.cwd(), 'data', 'payment-config.json')

export const PAYMENT_ENV_KEYS = [
  'BANK_QR_BANK_CODE',
  'BANK_QR_BANK_NAME',
  'BANK_QR_ACCOUNT_NO',
  'BANK_QR_ACCOUNT_NAME',
  'BANK_QR_TEMPLATE',
  'MOMO_PARTNER_CODE',
  'MOMO_ACCESS_KEY',
  'MOMO_SECRET_KEY',
  'MOMO_ENDPOINT',
  'VIETTEL_MONEY_MERCHANT_ID',
  'VIETTEL_MONEY_SECRET_KEY',
  'VIETTEL_MONEY_ENDPOINT',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_SECRET_KEY',
  'PAYPAL_BASE_URL',
  'PAYMENT_PROVIDER_VN',
  'PAYMENT_PROVIDER_GLOBAL',
  'PAYMENT_PROCESSING_MODE',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_PAYMENT_CHANNEL',
] as const

type PaymentEnvKey = (typeof PAYMENT_ENV_KEYS)[number]
type PaymentEnvMap = Record<PaymentEnvKey, string>

export type PaymentConfigSnapshot = {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  qrTemplate: string
  momoPartnerCode: string
  momoAccessKeyPreview: string
  hasMomoSecretKey: boolean
  momoEndpoint: string
  viettelMerchantId: string
  hasViettelSecretKey: boolean
  viettelEndpoint: string
  paypalClientId: string
  hasPaypalSecretKey: boolean
  paypalBaseUrl: string
  defaultProviderVN: string
  defaultProviderGlobal: string
  processingMode: 'manual' | 'sandbox' | 'live'
  telegramTokenPreview: string
  hasTelegramToken: boolean
  telegramChannel: string
}

function emptyEnvMap(): PaymentEnvMap {
  return {
    BANK_QR_BANK_CODE: '',
    BANK_QR_BANK_NAME: '',
    BANK_QR_ACCOUNT_NO: '',
    BANK_QR_ACCOUNT_NAME: '',
    BANK_QR_TEMPLATE: 'compact2',
    MOMO_PARTNER_CODE: '',
    MOMO_ACCESS_KEY: '',
    MOMO_SECRET_KEY: '',
    MOMO_ENDPOINT: '',
    VIETTEL_MONEY_MERCHANT_ID: '',
    VIETTEL_MONEY_SECRET_KEY: '',
    VIETTEL_MONEY_ENDPOINT: '',
    PAYPAL_CLIENT_ID: '',
    PAYPAL_SECRET_KEY: '',
    PAYPAL_BASE_URL: 'https://www.paypal.com',
    PAYMENT_PROVIDER_VN: 'bank_qr,momo,viettel_money',
    PAYMENT_PROVIDER_GLOBAL: 'paypal',
    PAYMENT_PROCESSING_MODE: 'manual',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_PAYMENT_CHANNEL: '',
  }
}

function parseEnvContent(content: string): Partial<PaymentEnvMap> {
  const values: Partial<PaymentEnvMap> = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (PAYMENT_ENV_KEYS.includes(key as PaymentEnvKey)) {
      values[key as PaymentEnvKey] = rawValue.replace(/^['"]|['"]$/g, '')
    }
  }

  return values
}

function parseStoredConfig(content: string): Partial<PaymentEnvMap> {
  const parsed = JSON.parse(content) as Partial<PaymentEnvMap>
  const values: Partial<PaymentEnvMap> = {}

  for (const key of PAYMENT_ENV_KEYS) {
    const rawValue = parsed[key]
    if (typeof rawValue === 'string') {
      values[key] = rawValue
    }
  }

  return values
}

async function readEnvFileMap(): Promise<PaymentEnvMap> {
  try {
    const content = await fs.readFile(ENV_FILE_PATH, 'utf8')
    return {
      ...emptyEnvMap(),
      ...parseEnvContent(content),
    }
  } catch {
    return emptyEnvMap()
  }
}

async function readConfigStoreMap(): Promise<PaymentEnvMap> {
  try {
    const content = await fs.readFile(CONFIG_STORE_PATH, 'utf8')
    return {
      ...emptyEnvMap(),
      ...parseStoredConfig(content),
    }
  } catch {
    return emptyEnvMap()
  }
}

function readRuntimeMap(): PaymentEnvMap {
  return {
    BANK_QR_BANK_CODE: process.env.BANK_QR_BANK_CODE ?? '',
    BANK_QR_BANK_NAME: process.env.BANK_QR_BANK_NAME ?? '',
    BANK_QR_ACCOUNT_NO: process.env.BANK_QR_ACCOUNT_NO ?? '',
    BANK_QR_ACCOUNT_NAME: process.env.BANK_QR_ACCOUNT_NAME ?? '',
    BANK_QR_TEMPLATE: process.env.BANK_QR_TEMPLATE ?? 'compact2',
    MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE ?? '',
    MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY ?? '',
    MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY ?? '',
    MOMO_ENDPOINT: process.env.MOMO_ENDPOINT ?? '',
    VIETTEL_MONEY_MERCHANT_ID: process.env.VIETTEL_MONEY_MERCHANT_ID ?? '',
    VIETTEL_MONEY_SECRET_KEY: process.env.VIETTEL_MONEY_SECRET_KEY ?? '',
    VIETTEL_MONEY_ENDPOINT: process.env.VIETTEL_MONEY_ENDPOINT ?? '',
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ?? '',
    PAYPAL_SECRET_KEY: process.env.PAYPAL_SECRET_KEY ?? '',
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL ?? 'https://www.paypal.com',
    PAYMENT_PROVIDER_VN: process.env.PAYMENT_PROVIDER_VN ?? 'bank_qr,momo,viettel_money',
    PAYMENT_PROVIDER_GLOBAL: process.env.PAYMENT_PROVIDER_GLOBAL ?? 'paypal',
    PAYMENT_PROCESSING_MODE: process.env.PAYMENT_PROCESSING_MODE ?? 'manual',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
    TELEGRAM_PAYMENT_CHANNEL: process.env.TELEGRAM_PAYMENT_CHANNEL ?? '',
  }
}

function mergePaymentEnvMaps(fileMap: PaymentEnvMap, runtimeMap: PaymentEnvMap): PaymentEnvMap {
  const merged = { ...fileMap }

  for (const key of PAYMENT_ENV_KEYS) {
    const runtimeValue = runtimeMap[key]
    if (runtimeValue.trim()) {
      merged[key] = runtimeValue
    }
  }

  return merged
}

function preview(value: string) {
  if (!value) return ''
  if (value.length <= 6) return '••••••'
  return `${value.slice(0, 4)}••••${value.slice(-2)}`
}

export async function getPaymentConfigSnapshot(): Promise<PaymentConfigSnapshot> {
  const merged = mergePaymentEnvMaps(
    mergePaymentEnvMaps(await readEnvFileMap(), await readConfigStoreMap()),
    readRuntimeMap(),
  )

  return {
    bankCode: merged.BANK_QR_BANK_CODE,
    bankName: merged.BANK_QR_BANK_NAME,
    accountNumber: merged.BANK_QR_ACCOUNT_NO,
    accountName: merged.BANK_QR_ACCOUNT_NAME,
    qrTemplate: merged.BANK_QR_TEMPLATE || 'compact2',
    momoPartnerCode: merged.MOMO_PARTNER_CODE,
    momoAccessKeyPreview: preview(merged.MOMO_ACCESS_KEY),
    hasMomoSecretKey: Boolean(merged.MOMO_SECRET_KEY),
    momoEndpoint: merged.MOMO_ENDPOINT,
    viettelMerchantId: merged.VIETTEL_MONEY_MERCHANT_ID,
    hasViettelSecretKey: Boolean(merged.VIETTEL_MONEY_SECRET_KEY),
    viettelEndpoint: merged.VIETTEL_MONEY_ENDPOINT,
    paypalClientId: merged.PAYPAL_CLIENT_ID,
    hasPaypalSecretKey: Boolean(merged.PAYPAL_SECRET_KEY),
    paypalBaseUrl: merged.PAYPAL_BASE_URL || 'https://www.paypal.com',
    defaultProviderVN: merged.PAYMENT_PROVIDER_VN,
    defaultProviderGlobal: merged.PAYMENT_PROVIDER_GLOBAL,
    processingMode: merged.PAYMENT_PROCESSING_MODE === 'live' || merged.PAYMENT_PROCESSING_MODE === 'sandbox' ? merged.PAYMENT_PROCESSING_MODE : 'manual',
    telegramTokenPreview: preview(merged.TELEGRAM_BOT_TOKEN),
    hasTelegramToken: Boolean(merged.TELEGRAM_BOT_TOKEN),
    telegramChannel: merged.TELEGRAM_PAYMENT_CHANNEL || cmsTelegramBookingConfig.globalChannel,
  }
}

export async function getPaymentGatewayConfig() {
  const merged = mergePaymentEnvMaps(
    mergePaymentEnvMaps(await readEnvFileMap(), await readConfigStoreMap()),
    readRuntimeMap(),
  )

  return {
    bankCode: merged.BANK_QR_BANK_CODE,
    bankName: merged.BANK_QR_BANK_NAME,
    accountNumber: merged.BANK_QR_ACCOUNT_NO,
    accountName: merged.BANK_QR_ACCOUNT_NAME,
    qrTemplate: merged.BANK_QR_TEMPLATE || 'compact2',
    momoPartnerCode: merged.MOMO_PARTNER_CODE,
    momoAccessKey: merged.MOMO_ACCESS_KEY,
    momoSecretKey: merged.MOMO_SECRET_KEY,
    momoEndpoint: merged.MOMO_ENDPOINT,
    viettelMerchantId: merged.VIETTEL_MONEY_MERCHANT_ID,
    viettelSecretKey: merged.VIETTEL_MONEY_SECRET_KEY,
    viettelEndpoint: merged.VIETTEL_MONEY_ENDPOINT,
    paypalClientId: merged.PAYPAL_CLIENT_ID,
    paypalSecretKey: merged.PAYPAL_SECRET_KEY,
    paypalBaseUrl: merged.PAYPAL_BASE_URL || 'https://www.paypal.com',
    processingMode: merged.PAYMENT_PROCESSING_MODE === 'live' || merged.PAYMENT_PROCESSING_MODE === 'sandbox' ? merged.PAYMENT_PROCESSING_MODE : 'manual' as const,
  }
}

export async function savePaymentConfig(values: {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  qrTemplate: string
  momoPartnerCode: string
  momoAccessKey?: string
  momoSecretKey?: string
  momoEndpoint: string
  viettelMerchantId: string
  viettelSecretKey?: string
  viettelEndpoint: string
  paypalClientId: string
  paypalSecretKey?: string
  paypalBaseUrl: string
  defaultProviderVN: string
  defaultProviderGlobal: string
  processingMode: 'manual' | 'sandbox' | 'live'
  telegramBotToken?: string
  telegramChannel: string
}) {
  assertRuntimeConfigurationWritable()
  assertSafeConfigurationValues(values)
  const [envMap, storeMap] = await Promise.all([readEnvFileMap(), readConfigStoreMap()])
  const current = mergePaymentEnvMaps(envMap, storeMap)

  const next: PaymentEnvMap = {
    BANK_QR_BANK_CODE: values.bankCode.trim(),
    BANK_QR_BANK_NAME: values.bankName.trim(),
    BANK_QR_ACCOUNT_NO: values.accountNumber.trim(),
    BANK_QR_ACCOUNT_NAME: values.accountName.trim(),
    BANK_QR_TEMPLATE: values.qrTemplate.trim() || 'compact2',
    MOMO_PARTNER_CODE: values.momoPartnerCode.trim(),
    MOMO_ACCESS_KEY: values.momoAccessKey?.trim() || current.MOMO_ACCESS_KEY,
    MOMO_SECRET_KEY: values.momoSecretKey?.trim() || current.MOMO_SECRET_KEY,
    MOMO_ENDPOINT: values.momoEndpoint.trim(),
    VIETTEL_MONEY_MERCHANT_ID: values.viettelMerchantId.trim(),
    VIETTEL_MONEY_SECRET_KEY: values.viettelSecretKey?.trim() || current.VIETTEL_MONEY_SECRET_KEY,
    VIETTEL_MONEY_ENDPOINT: values.viettelEndpoint.trim(),
    PAYPAL_CLIENT_ID: values.paypalClientId.trim(),
    PAYPAL_SECRET_KEY: values.paypalSecretKey?.trim() || current.PAYPAL_SECRET_KEY,
    PAYPAL_BASE_URL: values.paypalBaseUrl.trim() || 'https://www.paypal.com',
    PAYMENT_PROVIDER_VN: values.defaultProviderVN.trim() || 'bank_qr,momo,viettel_money',
    PAYMENT_PROVIDER_GLOBAL: values.defaultProviderGlobal.trim() || 'paypal',
    PAYMENT_PROCESSING_MODE: values.processingMode,
    TELEGRAM_BOT_TOKEN: values.telegramBotToken?.trim() || current.TELEGRAM_BOT_TOKEN || '',
    TELEGRAM_PAYMENT_CHANNEL: values.telegramChannel.trim() || current.TELEGRAM_PAYMENT_CHANNEL || cmsTelegramBookingConfig.globalChannel,
  }

  let content = ''
  try {
    content = await fs.readFile(ENV_FILE_PATH, 'utf8')
  } catch {
    content = ''
  }

  const lines = content ? content.split(/\r?\n/) : []
  const writtenKeys = new Set<string>()
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) return line

    const key = match[1] as PaymentEnvKey
    if (!PAYMENT_ENV_KEYS.includes(key)) return line

    writtenKeys.add(key)
    return `${key}=${next[key]}`
  })

  for (const key of PAYMENT_ENV_KEYS) {
    if (!writtenKeys.has(key)) {
      nextLines.push(`${key}=${next[key]}`)
    }
    process.env[key] = next[key]
  }

  await fs.mkdir(path.dirname(CONFIG_STORE_PATH), { recursive: true })
  await fs.writeFile(CONFIG_STORE_PATH, JSON.stringify(next, null, 2), 'utf8')

  try {
    await fs.writeFile(ENV_FILE_PATH, `${nextLines.filter(Boolean).join('\n')}\n`, 'utf8')
  } catch {
    // Prefer keeping payment config usable from the JSON store even if env mirroring fails.
  }

  return getPaymentConfigSnapshot()
}

export async function getTelegramPaymentConfig() {
  const snapshot = await getPaymentConfigSnapshot()

  return {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    channel: snapshot.telegramChannel || cmsTelegramBookingConfig.globalChannel,
  }
}

export async function saveTelegramBookingChannel(channel: string) {
  assertSafeConfigurationValues({ telegramChannel: channel })
  const nextChannel = channel.trim()
  if (!nextChannel) throw new Error('telegram_channel_required')

  process.env.TELEGRAM_PAYMENT_CHANNEL = nextChannel

  let content = ''
  try {
    content = await fs.readFile(ENV_FILE_PATH, 'utf8')
  } catch {
    // The JSON store below remains the source of truth when the env file is unavailable.
  }

  const lines = content ? content.split(/\r?\n/) : []
  let updated = false
  const nextLines = lines.map((line) => {
    if (!line.match(/^TELEGRAM_PAYMENT_CHANNEL=/)) return line
    updated = true
    return `TELEGRAM_PAYMENT_CHANNEL=${nextChannel}`
  })
  if (!updated) nextLines.push(`TELEGRAM_PAYMENT_CHANNEL=${nextChannel}`)

  await fs.mkdir(path.dirname(CONFIG_STORE_PATH), { recursive: true })
  const current = await readConfigStoreMap()
  await fs.writeFile(CONFIG_STORE_PATH, JSON.stringify({ ...current, TELEGRAM_PAYMENT_CHANNEL: nextChannel }, null, 2), 'utf8')
  await fs.writeFile(ENV_FILE_PATH, `${nextLines.filter(Boolean).join('\n')}\n`, 'utf8').catch(() => undefined)

  return { channel: nextChannel }
}
