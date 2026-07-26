import 'server-only'

import { loadPayloadClient } from '@/lib/payload-runtime'
import { spendStarsForUser } from '@/lib/site-user-session'

export type VoteTargetType = 'artist' | 'outlet'

type VoteTarget = {
  type: VoteTargetType
  slug: string
}

const voteLocks = new Map<string, Promise<void>>()

async function withVoteLock<T>(key: string, task: () => Promise<T>) {
  const previous = voteLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.then(() => current)
  voteLocks.set(key, queued)

  await previous
  try {
    return await task()
  } finally {
    release()
    if (voteLocks.get(key) === queued) voteLocks.delete(key)
  }
}

export async function getContentVoteCounts(type: VoteTargetType, slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))]
  if (!uniqueSlugs.length) return new Map<string, number>()

  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: 'content-votes',
    where: {
      and: [
        { targetType: { equals: type } },
        { targetSlug: { in: uniqueSlugs } },
        { status: { equals: 'confirmed' } },
      ],
    },
    limit: 5000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })

  const counts = new Map<string, number>()
  for (const vote of result.docs as Array<Record<string, unknown>>) {
    const slug = String(vote.targetSlug ?? '')
    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  }
  return counts
}

async function isPublishedTarget(target: VoteTarget) {
  const payload = await loadPayloadClient()
  const result = await payload.find({
    collection: target.type === 'artist' ? 'artists' : 'outlet-profiles',
    where: target.type === 'artist'
      ? { and: [{ slug: { equals: target.slug } }, { profileStatus: { equals: 'published' } }] }
      : { and: [{ slug: { equals: target.slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.length > 0
}

export async function castContentVote(input: { userId: string; target: VoteTarget }) {
  const lockKey = `${input.userId}:${input.target.type}:${input.target.slug}`
  return withVoteLock(lockKey, async () => {
    if (!(await isPublishedTarget(input.target))) {
      return { ok: false as const, reason: 'target_unavailable' as const }
    }

    const payload = await loadPayloadClient()
    const existing = await payload.find({
      collection: 'content-votes',
      where: {
        and: [
          { targetType: { equals: input.target.type } },
          { targetSlug: { equals: input.target.slug } },
          { siteUserId: { equals: input.userId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs.length) {
      const counts = await getContentVoteCounts(input.target.type, [input.target.slug])
      return { ok: true as const, alreadyVoted: true, voteCount: counts.get(input.target.slug) ?? 0 }
    }

    // Reserve the unique user/target vote first so repeat clicks cannot charge twice.
    const vote = await payload.create({
      collection: 'content-votes',
      data: {
        targetType: input.target.type,
        targetSlug: input.target.slug,
        siteUserId: input.userId,
        user: Number(input.userId) || undefined,
        status: 'confirmed',
      },
      depth: 0,
      overrideAccess: true,
    })

    const charge = await spendStarsForUser(input.userId, 1, 'spend_vote', {
      reference: `content-vote:${input.target.type}:${input.target.slug}:${input.userId}`,
      note: `Vote for ${input.target.type} ${input.target.slug}`,
    })
    if (!charge.ok) {
      await payload.delete({ collection: 'content-votes', id: vote.id, overrideAccess: true })
      return charge
    }

    const counts = await getContentVoteCounts(input.target.type, [input.target.slug])
    return { ok: true as const, alreadyVoted: false, voteCount: counts.get(input.target.slug) ?? 0, state: charge.state }
  })
}
