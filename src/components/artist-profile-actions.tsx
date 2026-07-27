'use client'

import Link from 'next/link'
import { Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { USER_ACCESS_STATE_EVENT, castContentVote, fetchUserAccessState, loginDemoUser, type UserAccessState } from '@/lib/client-user-access'
import { createReferralShareUrl } from '@/lib/client-referrals'
import { copyText } from '@/lib/client-share'
import { normalizeSharePath } from '@/lib/url-slug'
import { StarTopupDialog } from '@/components/star-topup-dialog'
import { StarAmount } from '@/components/star-amount'

type ArtistProfileActionsProps = {
  artistName: string
  artistSlug: string
  bookingHref: string
  initialVoteCount?: number
}

export function ArtistProfileActions({
  artistName,
  artistSlug,
  bookingHref,
  initialVoteCount = 0,
}: ArtistProfileActionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(10)
  const [showVoteLogin, setShowVoteLogin] = useState(false)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [pendingVote, setPendingVote] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setStarBalance(snapshot.state.stars)
    })()
  }, [])

  useEffect(() => {
    const handleAccessUpdate = (event: Event) => setStarBalance((event as CustomEvent<UserAccessState>).detail.stars)
    window.addEventListener(USER_ACCESS_STATE_EVENT, handleAccessUpdate)
    return () => window.removeEventListener(USER_ACCESS_STATE_EVENT, handleAccessUpdate)
  }, [])

  const handleVote = async () => {
    if (isVoting) return
    setIsVoting(true)
    try {
      const result = await castContentVote('artist', artistSlug)
      if (result.state) setStarBalance(result.state.stars)

      if (!result.ok) {
        if (result.reason === 'not_authenticated') {
          setPendingVote(true)
          setShowVoteLogin(true)
          return
        }

        if (result.reason === 'insufficient_stars') {
          setShowTopupModal(true)
          return
        }

        window.alert('Hệ thống chưa thể xác nhận vote lúc này. Số sao chỉ bị trừ khi vote được ghi nhận thành công.')
        return
      }

      setVoteCount(result.voteCount ?? voteCount)
      setHasVoted(true)
    } finally {
      setIsVoting(false)
    }
  }

  const handleVoteLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!loginEmail || !loginPassword) return

    const result = await loginDemoUser(loginEmail, loginPassword)
    if (!result.ok) {
      window.alert(result.message ?? 'Đăng nhập chưa thành công.')
      return
    }

    const snapshot = await fetchUserAccessState()
    setIsAuthenticated(snapshot.state.isAuthenticated)
    setStarBalance(snapshot.state.stars)
    setShowVoteLogin(false)
    setLoginPassword('')

    if (pendingVote) {
      setPendingVote(false)
      window.setTimeout(() => void handleVote(), 0)
    }
  }

  const handleShare = async () => {
    const path = normalizeSharePath(`/nghe-si/${artistSlug}`)
    const fallbackUrl = new URL(path, window.location.origin).toString()
    const referral = await createReferralShareUrl(path)
    const shareUrl = referral.url ?? fallbackUrl

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: artistName,
          text: `Xem profile nghệ sĩ ${artistName} trên 9LIFE MAG`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    const copied = await copyText(shareUrl)
    if (!copied) window.prompt('Copy link profile nghệ sĩ', shareUrl)
    window.alert(referral.ok ? 'Đã copy link chia sẻ. Sao sẽ được cộng khi có lượt truy cập hợp lệ.' : 'Đã copy link chia sẻ profile nghệ sĩ.')
  }

  return (
    <>
      <div className="artist-profile-action-bar">
        <Link href={bookingHref} className="button">
          Booking nghệ sĩ
        </Link>
        <button
          type="button"
          className={hasVoted ? 'button-secondary button-secondary-highlighted' : 'button-secondary'}
          onClick={() => void handleVote()}
          disabled={isVoting}
        >
          {isVoting ? 'Đang vote...' : 'Vote nghệ sĩ'}
        </button>
        <button
          type="button"
          className="button-secondary artist-profile-share-button"
          onClick={() => void handleShare()}
          aria-label="Chia sẻ profile nghệ sĩ"
          title="Chia sẻ profile nghệ sĩ"
        >
          <Share2 size={16} />
        </button>
        <div className="artist-profile-action-meta">
          <strong>{voteCount.toLocaleString('en-US')}</strong>
          <span>{isAuthenticated ? <>Còn <StarAmount amount={starBalance} /></> : <>Vote cho {artistName} tốn <StarAmount amount={1} /></>}</span>
        </div>
      </div>

      {showVoteLogin ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Đăng nhập để vote nghệ sĩ</div>
            <h3>Vote nghệ sĩ sẽ trừ 1 sao từ ví user</h3>
            <p className="muted">
              Hãy đăng nhập trước để hệ thống trừ sao hợp lý khi bạn vote cho nghệ sĩ yêu thích.
            </p>

            <form className="login-gate-form" onSubmit={handleVoteLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
              <div className="login-gate-actions">
                <button type="button" className="button-secondary" onClick={() => setShowVoteLogin(false)}>
                  Để sau
                </button>
                <button type="submit" className="button">
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <StarTopupDialog open={showTopupModal} onClose={() => setShowTopupModal(false)} />
    </>
  )
}
