'use client'

import Link from 'next/link'
import { Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchUserAccessState, loginDemoUser, spendUserStars } from '@/lib/client-user-access'
import { createReferralShareUrl } from '@/lib/client-referrals'

const outletVoteSeed: Record<string, number> = {
  'luxe-district': 4231,
  'saigon-signal': 3764,
  'nexa-beach-club': 3410,
  'velour-27': 2985,
  'mirage-port': 3142,
  'rouge-signal': 2870,
  'district-9-pulse': 3328,
  'amber-bay': 2744,
  'halo-rooftop': 4012,
  'wave-garden': 3526,
  'afterglow-hue': 2316,
  'coastline-86': 2448,
  'marina-gold': 3195,
  'lotus-afterdark': 3362,
  'moonset-port': 2654,
  'skyline-river': 2281,
  'velvet-room': 3950,
  'north-pulse': 3875,
  'skyline-88': 2560,
  'ivory-noir': 2422,
  'metro-11': 3611,
  'polar-beat': 2337,
  'moon-velvet': 2146,
  'crown-district': 3264,
}

type OutletProfileActionsProps = {
  bookingHref: string
  outletName: string
  outletSlug: string
}

export function OutletProfileActions({
  bookingHref,
  outletName,
  outletSlug,
}: OutletProfileActionsProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(10)
  const [showVoteLogin, setShowVoteLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [pendingVote, setPendingVote] = useState(false)
  const [voteCount, setVoteCount] = useState(outletVoteSeed[outletSlug] ?? 0)
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

      window.alert('Bạn không đủ sao để vote outlet. Hãy nạp thêm sao trong tài khoản.')
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
    const fallbackUrl = `${window.location.origin}/dat-ban/${outletSlug}`
    const referral = await createReferralShareUrl(`/dat-ban/${outletSlug}`)
    const shareUrl = referral.url ?? fallbackUrl

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: outletName,
          text: `Xem profile outlet ${outletName} trên 9LIFE MAG`,
          url: shareUrl,
        })
        return
      } catch {
        return
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      window.alert(referral.ok ? 'Đã copy link chia sẻ. Sao sẽ được cộng khi có lượt truy cập hợp lệ.' : 'Đã copy link chia sẻ profile outlet.')
      return
    }

    window.prompt('Copy link profile outlet', shareUrl)
  }

  return (
    <>
      <div className="outlet-profile-action-bar">
        <Link href={bookingHref} className="button">
          Đặt bàn
        </Link>
        <button
          type="button"
          className={hasVoted ? 'button-secondary button-secondary-highlighted' : 'button-secondary'}
          onClick={() => void handleVote()}
        >
          Vote outlet
        </button>
        <button
          type="button"
          className="button-secondary outlet-profile-share-button"
          onClick={() => void handleShare()}
          aria-label="Chia sẻ profile outlet"
          title="Chia sẻ profile outlet"
        >
          <Share2 size={16} />
        </button>
        <div className="outlet-profile-action-meta">
          <strong>{voteCount.toLocaleString('en-US')}</strong>
          <span>{isAuthenticated ? `Còn ${starBalance} sao` : `Vote cho ${outletName} tốn 1 sao`}</span>
        </div>
      </div>

      {showVoteLogin ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Đăng nhập để vote outlet</div>
            <h3>Vote outlet sẽ trừ 1 sao từ ví user</h3>
            <p className="muted">
              Hãy đăng nhập trước để hệ thống trừ sao hợp lý khi bạn vote cho outlet yêu thích.
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
