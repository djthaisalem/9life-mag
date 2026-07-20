import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'

export type StudentApplicationStatus = 'new' | 'accepted' | 'declined'
export type StudentApplication = {
  id: string
  targetType: 'artist' | 'agent'
  targetSlug: string
  targetName: string
  fullName: string
  email: string
  phone: string
  city: string
  experience: string
  learningGoal: string
  availability: string
  referenceLink: string
  status: StudentApplicationStatus
  createdAt: string
}

type StudentApplicationInput = Omit<StudentApplication, 'id' | 'status' | 'createdAt'>
const storePath = path.join(process.cwd(), 'data', 'student-applications.json')

function normalize(row: Record<string, unknown>): StudentApplication {
  return {
    id: String(row.id), targetType: row.targetType === 'agent' ? 'agent' : 'artist', targetSlug: String(row.targetSlug ?? ''), targetName: String(row.targetName ?? ''),
    fullName: String(row.fullName ?? ''), email: String(row.email ?? ''), phone: String(row.phone ?? ''), city: String(row.city ?? ''), experience: String(row.experience ?? ''),
    learningGoal: String(row.learningGoal ?? ''), availability: String(row.availability ?? ''), referenceLink: String(row.referenceLink ?? ''),
    status: row.status === 'accepted' || row.status === 'declined' ? row.status : 'new', createdAt: String(row.createdAt ?? ''),
  }
}

async function readStore() {
  try { return JSON.parse(await fs.readFile(storePath, 'utf8')) as StudentApplication[] } catch { return [] }
}

async function writeStore(rows: StudentApplication[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(rows, null, 2), 'utf8')
}

export async function createStudentApplication(input: StudentApplicationInput) {
  const application: StudentApplication = { id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...input, status: 'new', createdAt: new Date().toISOString() }
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const created = await payload.create({ collection: 'student-applications', data: application })
    return normalize(created as Record<string, unknown>)
  }
  const rows = await readStore()
  await writeStore([application, ...rows])
  return application
}

export async function getStudentApplications(filter?: { targetType?: StudentApplication['targetType']; targetSlug?: string }) {
  const matches = (row: StudentApplication) => (!filter?.targetType || row.targetType === filter.targetType) && (!filter?.targetSlug || row.targetSlug === filter.targetSlug)
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'student-applications', sort: '-createdAt', limit: 100, depth: 0, pagination: false })
    return (result.docs as Array<Record<string, unknown>>).map(normalize).filter(matches)
  }
  return (await readStore()).filter(matches).sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

export async function updateStudentApplicationStatus(id: string, status: StudentApplicationStatus) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    return normalize(await payload.update({ collection: 'student-applications', id, data: { status } }) as Record<string, unknown>)
  }
  const rows = await readStore()
  const application = rows.find((row) => row.id === id)
  if (!application) throw new Error('student-application-not-found')
  application.status = status
  await writeStore(rows)
  return application
}
