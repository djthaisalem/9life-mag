import type { AudioTrack } from '@/lib/audio-types'

function shuffleItems<T>(items: readonly T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export function getFairRotation(key: string, ids: string[], count: number) {
  if (typeof window === 'undefined') return ids.slice(0, count)

  const allowed = new Set(ids)
  let remaining: string[] = []
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? '{}') as { remaining?: unknown }
    if (Array.isArray(stored.remaining)) {
      const seen = new Set<string>()
      remaining = stored.remaining.filter((id): id is string => typeof id === 'string' && allowed.has(id) && !seen.has(id) && (seen.add(id), true))
    }
  } catch {
    remaining = []
  }

  const selected: string[] = []
  while (selected.length < Math.min(count, ids.length)) {
    if (!remaining.length) {
      const next = shuffleItems(ids)
      const selectedSet = new Set(selected)
      remaining = [...next.filter((id) => !selectedSet.has(id)), ...next.filter((id) => selectedSet.has(id))]
    }
    const nextId = remaining.shift()
    if (nextId && !selected.includes(nextId)) selected.push(nextId)
  }

  window.localStorage.setItem(key, JSON.stringify({ remaining }))
  return selected
}

export function curateMusicCatalog(catalog: readonly AudioTrack[], rotationKey: string) {
  const newest = catalog.slice(0, 5)
  const rotating = catalog.slice(5)
  const rotatingIds = getFairRotation(rotationKey, rotating.map((track) => track.id), 5)
  const trackById = new Map(catalog.map((track) => [track.id, track]))
  const fairTracks = rotatingIds.map((id) => trackById.get(id)).filter((track): track is AudioTrack => Boolean(track))

  if (typeof window === 'undefined') return [...newest, ...fairTracks].slice(0, 10)
  return shuffleItems([...newest, ...fairTracks]).slice(0, 10)
}
