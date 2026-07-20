import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { assertRuntimeConfigurationWritable, assertSafeConfigurationValues } from '@/lib/config-input-security'

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local')

export const R2_ENV_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_ENDPOINT',
  'R2_PUBLIC_BASE_URL',
] as const

type R2EnvKey = (typeof R2_ENV_KEYS)[number]

type R2EnvMap = Record<R2EnvKey, string>

export type R2ConfigSnapshot = {
  accountId: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  accessKeyPreview: string
  hasSecretAccessKey: boolean
  isConfigured: boolean
}

function emptyEnvMap(): R2EnvMap {
  return {
    R2_ACCOUNT_ID: '',
    R2_ACCESS_KEY_ID: '',
    R2_SECRET_ACCESS_KEY: '',
    R2_BUCKET: '',
    R2_ENDPOINT: '',
    R2_PUBLIC_BASE_URL: '',
  }
}

function parseEnvContent(content: string): Partial<R2EnvMap> {
  const values: Partial<R2EnvMap> = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match

    if (R2_ENV_KEYS.includes(key as R2EnvKey)) {
      values[key as R2EnvKey] = rawValue.replace(/^['"]|['"]$/g, '')
    }
  }

  return values
}

async function readEnvFileMap(): Promise<R2EnvMap> {
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

function readRuntimeMap(): R2EnvMap {
  return {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
    R2_BUCKET: process.env.R2_BUCKET ?? '',
    R2_ENDPOINT: process.env.R2_ENDPOINT ?? '',
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ?? '',
  }
}

function buildAccessKeyPreview(value: string) {
  if (!value) return ''
  if (value.length <= 6) return '••••••'
  return `${value.slice(0, 4)}••••${value.slice(-2)}`
}

export async function getR2ConfigSnapshot(): Promise<R2ConfigSnapshot> {
  const fileMap = await readEnvFileMap()
  const runtimeMap = readRuntimeMap()
  const merged = { ...fileMap, ...runtimeMap }

  const accountId = merged.R2_ACCOUNT_ID
  const bucket = merged.R2_BUCKET
  const endpoint = merged.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
  const publicBaseUrl = merged.R2_PUBLIC_BASE_URL
  const accessKeyId = merged.R2_ACCESS_KEY_ID
  const secretAccessKey = merged.R2_SECRET_ACCESS_KEY

  return {
    accountId,
    bucket,
    endpoint,
    publicBaseUrl,
    accessKeyPreview: buildAccessKeyPreview(accessKeyId),
    hasSecretAccessKey: Boolean(secretAccessKey),
    isConfigured: Boolean(accountId && bucket && endpoint && accessKeyId && secretAccessKey),
  }
}

export async function saveR2Config(values: {
  accountId: string
  accessKeyId?: string
  secretAccessKey?: string
  bucket: string
  endpoint?: string
  publicBaseUrl?: string
}) {
  assertRuntimeConfigurationWritable()
  assertSafeConfigurationValues(values)
  const current = await readEnvFileMap()

  const next: R2EnvMap = {
    R2_ACCOUNT_ID: values.accountId.trim(),
    R2_ACCESS_KEY_ID: values.accessKeyId?.trim() || current.R2_ACCESS_KEY_ID || '',
    R2_SECRET_ACCESS_KEY: values.secretAccessKey?.trim() || current.R2_SECRET_ACCESS_KEY || '',
    R2_BUCKET: values.bucket.trim(),
    R2_ENDPOINT:
      values.endpoint?.trim() || `https://${values.accountId.trim()}.r2.cloudflarestorage.com`,
    R2_PUBLIC_BASE_URL: values.publicBaseUrl?.trim() || '',
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

    const key = match[1] as R2EnvKey
    if (!R2_ENV_KEYS.includes(key)) return line

    writtenKeys.add(key)
    return `${key}=${next[key]}`
  })

  for (const key of R2_ENV_KEYS) {
    if (!writtenKeys.has(key)) {
      nextLines.push(`${key}=${next[key]}`)
    }
    process.env[key] = next[key]
  }

  await fs.writeFile(ENV_FILE_PATH, `${nextLines.filter(Boolean).join('\n')}\n`, 'utf8')

  return getR2ConfigSnapshot()
}

export function getR2StorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return null
  }

  return {
    bucket,
    config: {
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    },
  }
}
