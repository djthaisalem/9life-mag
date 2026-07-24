import 'server-only'

import { loadPayloadClient } from '@/lib/payload-runtime'
import type { UserPlaylist, UserPlaylistItem } from '@/lib/user-playlists'

type PlaylistDocument = {
  id: string | number
  ownerSiteUserId?: string
  userSnapshot?: unknown
}

function isPlaylistItem(value: unknown): value is UserPlaylistItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<UserPlaylistItem>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.artist === 'string' &&
    typeof item.duration === 'string' &&
    typeof item.audioUrl === 'string' &&
    typeof item.addedAt === 'string' &&
    (item.sourceType === 'track' || item.sourceType === 'nonstop' || item.sourceType === 'remix')
  )
}

function normalizeSnapshot(value: unknown): UserPlaylist | null {
  if (!value || typeof value !== 'object') return null
  const playlist = value as Partial<UserPlaylist>
  if (
    typeof playlist.id !== 'string' ||
    typeof playlist.name !== 'string' ||
    typeof playlist.shareCode !== 'string' ||
    typeof playlist.createdAt !== 'string' ||
    typeof playlist.updatedAt !== 'string' ||
    !Array.isArray(playlist.items) ||
    !playlist.items.every(isPlaylistItem)
  ) {
    return null
  }

  return {
    id: playlist.id,
    name: playlist.name,
    shareCode: playlist.shareCode,
    cover: typeof playlist.cover === 'string' ? playlist.cover : undefined,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    listens: typeof playlist.listens === 'number' ? playlist.listens : 0,
    rewardStars: typeof playlist.rewardStars === 'number' ? playlist.rewardStars : 0,
    favorites: typeof playlist.favorites === 'number' ? playlist.favorites : 0,
    note: typeof playlist.note === 'string' ? playlist.note : '',
    items: playlist.items,
  }
}

export async function getSharedUserPlaylist(shareCode: string) {
  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'playlists',
      where: {
        and: [
          { shareCode: { equals: shareCode } },
          { isUserPlaylist: { equals: true } },
          { isPublic: { equals: true } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })

    const document = result.docs[0] as PlaylistDocument | undefined
    return document ? normalizeSnapshot(document.userSnapshot) : null
  } catch (error) {
    console.error('Shared playlist query failed', error)
    return null
  }
}

export async function getPublishedUserPlaylists(limit = 20) {
  try {
    const payload = await loadPayloadClient()
    const result = await payload.find({
      collection: 'playlists',
      where: {
        and: [
          { isUserPlaylist: { equals: true } },
          { isPublic: { equals: true } },
          { status: { equals: 'published' } },
        ],
      },
      sort: '-publishedAt',
      limit,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })

    return (result.docs as PlaylistDocument[])
      .map((document) => normalizeSnapshot(document.userSnapshot))
      .filter((playlist): playlist is UserPlaylist => Boolean(playlist?.items.length))
  } catch (error) {
    console.error('Published user playlist query failed', error)
    return []
  }
}

export async function publishSharedUserPlaylist(ownerSiteUserId: string, playlist: UserPlaylist) {
  const payload = await loadPayloadClient()
  const existing = await payload.find({
    collection: 'playlists',
    where: {
      and: [
        { shareCode: { equals: playlist.shareCode } },
        { isUserPlaylist: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const current = existing.docs[0] as PlaylistDocument | undefined

  if (current?.ownerSiteUserId && current.ownerSiteUserId !== ownerSiteUserId) {
    throw new Error('PLAYLIST_OWNER_MISMATCH')
  }

  const data = {
    title: playlist.name,
    slug: `user-${playlist.shareCode}`,
    description: playlist.note,
    keyword: 'user-playlist',
    musician: '9LIFE Community',
    playlistType: 'editorial' as const,
    isVip: false,
    isFeatured: false,
    isPublic: true,
    shareCode: playlist.shareCode,
    ownerSiteUserId,
    isUserPlaylist: true,
    userSnapshot: playlist,
    publishedAt: new Date().toISOString(),
    status: 'published' as const,
    seoTitle: `${playlist.name} | 9LIFE Music`,
    seoDescription: playlist.note,
  }

  if (current) {
    await payload.update({
      collection: 'playlists',
      id: current.id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'playlists',
      data,
      overrideAccess: true,
    })
  }

  return playlist
}
