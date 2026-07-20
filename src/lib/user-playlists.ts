import type { AudioSourceType, AudioTrack } from '@/lib/audio-types'

export const USER_PLAYLIST_STORAGE_KEY = 'nine-life-user-playlists'

export type UserPlaylistItem = AudioTrack & {
  addedAt: string
  sourceType: AudioSourceType
}

export type UserPlaylist = {
  id: string
  name: string
  shareCode: string
  cover?: string
  createdAt: string
  updatedAt: string
  listens: number
  rewardStars: number
  favorites?: number
  note: string
  items: UserPlaylistItem[]
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8)
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getUserPlaylists() {
  if (!isBrowser()) return [] as UserPlaylist[]

  const raw = window.localStorage.getItem(USER_PLAYLIST_STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as UserPlaylist[]
  } catch {
    return []
  }
}

export function saveUserPlaylists(playlists: UserPlaylist[]) {
  if (!isBrowser()) return playlists
  window.localStorage.setItem(USER_PLAYLIST_STORAGE_KEY, JSON.stringify(playlists))
  return playlists
}

export function ensureUserPlaylists(seedPlaylists: UserPlaylist[]) {
  const current = getUserPlaylists()
  if (current.length > 0) return current
  return saveUserPlaylists(seedPlaylists)
}

export function createUserPlaylist(name: string, cover?: string) {
  const trimmed = name.trim()
  if (!trimmed) return null

  const now = new Date().toISOString()
  const playlist: UserPlaylist = {
    id: `playlist-${slugify(trimmed)}-${randomCode()}`,
    name: trimmed,
    shareCode: `${slugify(trimmed)}-${randomCode()}`,
    cover,
    createdAt: now,
    updatedAt: now,
    listens: 0,
    rewardStars: 0,
    favorites: 0,
    note: 'Playlist mới tạo, sẵn sàng để chia sẻ với cộng đồng.',
    items: []
  }

  const next = [playlist, ...getUserPlaylists()]
  saveUserPlaylists(next)
  return playlist
}

export function updateUserPlaylist(playlistId: string, changes: Pick<Partial<UserPlaylist>, 'name' | 'cover' | 'note'>) {
  const next = getUserPlaylists().map((playlist) => (
    playlist.id === playlistId
      ? { ...playlist, ...changes, updatedAt: new Date().toISOString() }
      : playlist
  ))

  return saveUserPlaylists(next)
}

export function deleteUserPlaylist(playlistId: string) {
  return saveUserPlaylists(getUserPlaylists().filter((playlist) => playlist.id !== playlistId))
}

export function addTrackToPlaylist(
  playlistId: string,
  track: AudioTrack,
  sourceType: UserPlaylistItem['sourceType']
) {
  const next = getUserPlaylists().map((playlist) => {
    if (playlist.id !== playlistId) return playlist

    const alreadyExists = playlist.items.some((item) => item.id === track.id)
    if (alreadyExists) return playlist

    const item: UserPlaylistItem = {
      ...track,
      sourceType,
      addedAt: new Date().toISOString()
    }

    return {
      ...playlist,
      updatedAt: new Date().toISOString(),
      note: playlist.items.length === 0 ? 'Playlist đã có track đầu tiên và có thể chia sẻ ngay.' : playlist.note,
      items: [...playlist.items, item]
    }
  })

  return saveUserPlaylists(next)
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  const next = getUserPlaylists().map((playlist) => {
    if (playlist.id !== playlistId) return playlist

    return {
      ...playlist,
      updatedAt: new Date().toISOString(),
      items: playlist.items.filter((item) => item.id !== trackId)
    }
  })

  return saveUserPlaylists(next)
}

export function recordPlaylistListen(playlistId: string) {
  const next = getUserPlaylists().map((playlist) => (
    playlist.id === playlistId
      ? { ...playlist, listens: playlist.listens + 1, updatedAt: new Date().toISOString() }
      : playlist
  ))

  return saveUserPlaylists(next)
}

export function buildPlaylistSharePath(shareCode: string) {
  return `/music/library/${shareCode}`
}

export function findPlaylistByShareCode(playlists: UserPlaylist[], shareCode: string | null) {
  if (!shareCode) return null
  return playlists.find((playlist) => playlist.shareCode === shareCode) ?? null
}
