import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'

const LISTENING_HISTORY_KEY = 'nine-life-music-listening-history'
const DOWNLOAD_HISTORY_KEY = 'nine-life-music-download-history'

export type MusicHistoryItem = AudioTrack & {
  sourceType: AudioSourceType
  occurredAt: string
}

function readHistory(key: string) {
  if (typeof window === 'undefined') return [] as MusicHistoryItem[]
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? '[]') as MusicHistoryItem[]
  } catch {
    return [] as MusicHistoryItem[]
  }
}

function saveHistory(key: string, item: MusicHistoryItem) {
  if (typeof window === 'undefined') return [] as MusicHistoryItem[]
  const next = [item, ...readHistory(key).filter((entry) => entry.id !== item.id)].slice(0, 50)
  window.localStorage.setItem(key, JSON.stringify(next))
  return next
}

export function getListeningHistory() { return readHistory(LISTENING_HISTORY_KEY) }
export function getDownloadHistory() { return readHistory(DOWNLOAD_HISTORY_KEY) }

export function recordListening(track: AudioTrack, sourceType: AudioSourceType) {
  return saveHistory(LISTENING_HISTORY_KEY, { ...track, sourceType, occurredAt: new Date().toISOString() })
}

export function recordDownload(track: AudioTrack, sourceType: AudioSourceType) {
  return saveHistory(DOWNLOAD_HISTORY_KEY, { ...track, sourceType, occurredAt: new Date().toISOString() })
}
