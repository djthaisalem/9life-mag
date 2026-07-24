'use client'

import Link from 'next/link'
import { Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchUserAccessState, loginDemoUser, spendUserStars } from '@/lib/client-user-access'
import { createReferralShareUrl } from '@/lib/client-referrals'
import { copyText } from '@/lib/client-share'
import { normalizeSharePath } from '@/lib/url-slug'

const artistVoteSeed: Record<string, number> = {
  'neon-viper': 12847,
  'luna-flux': 5912,
  'mc-blaze': 4820,
  'velvet-queen': 5344,
  'k-phantom': 6840,
  'nova-fire': 4988,
  'echo-violet': 10532,
  'ghost-frequency': 9104,
  'sora-vee': 4476,
  'rex-nova': 4332,
  'aria-rush': 4728,
  'kai-motion': 4185,
}

type ArtistProfileActionsProps = {
  artistName: string
  artistSlug: string
  bookingHref: string
}

export function ArtistProfileActions({
  artistName,
  artistSlug,
  bookingHref,
}: ArtistProfileActionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(10)
  const [showVoteLogin, setShowVoteLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [pendingVote, setPendingVote] = useState(false)
  const [voteCount, setVoteCount] = useState(artistVoteSeed[artistSlug] ?? 0)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setStarBalance(snapshot.state.stars)
    })()
  }, [])

  const handleVote = async () => {
    const result = await spendUserStars(1, 'vote')

    if (!result.ok) {
      if (result.reason === 'not_authenticated') {
        setPendingVote(true)
        setShowVoteLogin(true)
        return
      }

      window.alert('Bạn không đủ sao để vote nghệ sĩ. Hãy nạp thêm sao trong tài khoản.')
      return
    }

    setStarBalance(result.state.stars)
    setVoteCount((current) => current + 1)
    setHasVoted(true)
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
        >
          Vote nghệ sĩ
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
          <span>{isAuthenticated ? `Còn ${starBalance} sao` : `Vote cho ${artistName} tốn 1 sao`}</span>
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
    </>
  )
}
