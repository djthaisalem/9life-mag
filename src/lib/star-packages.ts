import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { starPackages as defaults } from '@/lib/star-payment-shared'

export type StoredStarPackage = {
  id: string
  title: string
  amount: number
  stars: number
  benefits: string[]
}

const storePath = path.join(process.cwd(), 'data', 'star-packages.json')

const fallback = () => defaults.map((item) => ({ ...item, benefits: [] }))

export async function getStarPackages(): Promise<StoredStarPackage[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(storePath, 'utf8')) as unknown
    if (!Array.isArray(parsed)) return fallback()
    const rows = parsed.filter((item): item is StoredStarPackage => Boolean(
      item && typeof item === 'object' && typeof (item as StoredStarPackage).id === 'string'
      && typeof (item as StoredStarPackage).title === 'string'
      && Number.isFinite((item as StoredStarPackage).amount)
      && Number.isFinite((item as StoredStarPackage).stars),
    ))
    return rows.length ? rows : fallback()
  } catch {
    return fallback()
  }
}

export async function saveStarPackages(rows: StoredStarPackage[]) {
  const normalized = rows.map((item) => ({
    id: item.id.trim().slice(0, 80),
    title: item.title.trim().slice(0, 120),
    amount: Math.max(1, Math.floor(item.amount)),
    stars: Math.max(1, Math.floor(item.stars)),
    benefits: item.benefits.map((benefit) => benefit.trim().slice(0, 120)).filter(Boolean).slice(0, 12),
  })).filter((item) => item.id && item.title)
  if (!normalized.length) throw new Error('star-packages-empty')
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}
