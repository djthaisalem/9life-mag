import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

type TargetType = 'artist' | 'agent'
type Setting = { targetType: TargetType; targetSlug: string; enabled: boolean }
const storePath = path.join(process.cwd(), 'data', 'student-registration-settings.json')

async function readStore() {
  try { return JSON.parse(await fs.readFile(storePath, 'utf8')) as Setting[] } catch { return [] }
}

async function writeStore(rows: Setting[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(rows, null, 2), 'utf8')
}

export async function getStudentRegistrationEnabled(targetType: TargetType, targetSlug: string) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'student-registration-settings', where: { and: [{ targetType: { equals: targetType } }, { targetSlug: { equals: targetSlug } }] }, limit: 1, depth: 0, pagination: false })
    return result.docs[0]?.enabled === true
  }
  return (await readStore()).find((item) => item.targetType === targetType && item.targetSlug === targetSlug)?.enabled === true
}

export async function setStudentRegistrationEnabled(targetType: TargetType, targetSlug: string, enabled: boolean) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'student-registration-settings', where: { and: [{ targetType: { equals: targetType } }, { targetSlug: { equals: targetSlug } }] }, limit: 1, depth: 0, pagination: false })
    if (result.docs[0]) await payload.update({ collection: 'student-registration-settings', id: String(result.docs[0].id), data: { enabled } })
    else await payload.create({ collection: 'student-registration-settings', data: { targetType, targetSlug, enabled } })
    return enabled
  }
  const rows = await readStore()
  const current = rows.find((item) => item.targetType === targetType && item.targetSlug === targetSlug)
  if (current) current.enabled = enabled
  else rows.push({ targetType, targetSlug, enabled })
  await writeStore(rows)
  return enabled
}
