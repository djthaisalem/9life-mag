'use client'

import { Heart, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchUserAccessState, toggleFollowedAgent } from '@/lib/client-user-access'
import { createReferralShareUrl } from '@/lib/client-referrals'
import { copyText } from '@/lib/client-share'

type AgentProfileActionsProps = {
  agentName: string
  agentSlug: string
}

export function AgentProfileActions({ agentName, agentSlug }: AgentProfileActionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setIsFollowed(snapshot.state.followedAgents.includes(agentSlug))
    })()
  }, [agentSlug])

  const handleFollow = async () => {
    if (!isAuthenticated) {
      window.alert('Hãy đăng nhập để theo dõi Agent và nhận các cập nhật liên quan.')
      return
    }

    const followedAgents = await toggleFollowedAgent(agentSlug)
    setIsFollowed(followedAgents.includes(agentSlug))
  }

  const handleShare = async () => {
    const fallbackUrl = `${window.location.origin}/agent/${agentSlug}`
    const referral = await createReferralShareUrl(`/agent/${agentSlug}`)
    const shareUrl = referral.url ?? fallbackUrl

    if (navigator.share) {
      try {
        await navigator.share({
          title: agentName,
          text: `Xem profile Agent ${agentName} trên 9LIFE MAG`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    const copied = await copyText(shareUrl)
    if (!copied) window.prompt('Copy link profile Agent', shareUrl)
    window.alert(referral.ok ? 'Đã copy link chia sẻ. Sao sẽ được cộng khi có lượt truy cập hợp lệ.' : 'Đã copy link profile Agent để chia sẻ.')
  }

  return <div className="agent-profile-actions">
    <button type="button" className={isFollowed ? 'button-secondary button-secondary-highlighted' : 'button-secondary'} onClick={() => void handleFollow()}>
      <Heart size={16} fill={isFollowed ? 'currentColor' : 'none'} />
      {isFollowed ? 'Đang theo dõi' : 'Theo dõi'}
    </button>
    <button type="button" className="button-secondary agent-profile-share-button" onClick={() => void handleShare()} aria-label="Chia sẻ profile Agent" title="Chia sẻ profile Agent">
      <Share2 size={16} />
      <span>Chia sẻ</span>
    </button>
  </div>
}
