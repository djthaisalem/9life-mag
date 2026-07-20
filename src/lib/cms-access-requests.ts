import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

const storePath = path.join(process.cwd(), 'data', 'cms-access-requests.json')
export type CmsAccessRequest = { id: string; name: string; email: string; organization: string; requestedRole: string; note: string; status: 'pending'; createdAt: string }

async function readStore(): Promise<CmsAccessRequest[]> {
  try { return JSON.parse(await fs.readFile(storePath, 'utf8')) as CmsAccessRequest[] } catch { return [] }
}

export async function createCmsAccessRequest(input: Omit<CmsAccessRequest, 'id' | 'status' | 'createdAt'>) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const email = input.email.trim().toLowerCase()
    const existing = await payload.find({ collection: 'cms-access-requests', where: { email: { equals: email } }, limit: 1, depth: 0, pagination: false })
    const existingRequest = existing.docs[0] as { id: string; name?: string; email?: string; organization?: string; requestedRole?: string; note?: string; status?: 'pending'; createdAt?: string } | undefined
    if (existingRequest?.status === 'pending') {
      return { created: false, request: { id: String(existingRequest.id), name: existingRequest.name ?? '', email: existingRequest.email ?? email, organization: existingRequest.organization ?? '', requestedRole: existingRequest.requestedRole ?? '', note: existingRequest.note ?? '', status: 'pending' as const, createdAt: existingRequest.createdAt ?? new Date().toISOString() } }
    }
    const created = await payload.create({ collection: 'cms-access-requests', data: { name: input.name.trim(), email, organization: input.organization.trim(), requestedRole: input.requestedRole, note: input.note.trim(), status: 'pending' }, depth: 0 }) as unknown as { id: string; createdAt?: string }
    return { created: true, request: { ...input, name: input.name.trim(), email, organization: input.organization.trim(), note: input.note.trim(), id: String(created.id), status: 'pending' as const, createdAt: created.createdAt ?? new Date().toISOString() } }
  }

  const requests = await readStore()
  const email = input.email.trim().toLowerCase()
  const existing = requests.find((item) => item.email === email && item.status === 'pending')
  if (existing) return { created: false, request: existing }
  const request: CmsAccessRequest = { ...input, name: input.name.trim(), email, organization: input.organization.trim(), note: input.note.trim(), id: `cms-request-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() }
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify([request, ...requests], null, 2), 'utf8')
  return { created: true, request }
}

export async function getCmsAccessRequests() {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'cms-access-requests', sort: '-createdAt', limit: 100, depth: 0, pagination: false })
    return (result.docs as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id), name: String(item.name ?? ''), email: String(item.email ?? ''), organization: String(item.organization ?? ''), requestedRole: String(item.requestedRole ?? ''), note: String(item.note ?? ''), status: 'pending' as const, createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    }))
  }

  return readStore()
}
