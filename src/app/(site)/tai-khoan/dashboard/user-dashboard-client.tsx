'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { nonstopTracks, remixTracks } from '@/lib/music-store-data'
import {
  addTrackToPlaylist,
  buildPlaylistSharePath,
  createUserPlaylist,
  findPlaylistByShareCode,
  getUserPlaylists,
  publishUserPlaylist,
  removeTrackFromPlaylist,
  saveUserPlaylists,
  type UserPlaylist,
} from '@/lib/user-playlists'
import { DashboardLogoutButton } from '@/components/dashboard-logout-button'
import {
  activatePremiumAccess,
  claimBonusStars,
  claimDailyStars,
  fetchUserAccessState,
  getPremiumAccess,
  type StoredUserProfile,
  type UserAccessState,
} from '@/lib/client-user-access'
import { copyText } from '@/lib/client-share'
import { createReferralShareUrl, getReferralSummary, type ReferralSummary } from '@/lib/client-referrals'
import { paymentProviders, starPackages, type PaymentProviderId, type StarTopupRequest } from '@/lib/star-payment-shared'
import { StarTopupDialog } from '@/components/star-topup-dialog'

const topUpPlans = starPackages.map((plan) => ({
  ...plan,
  price: `${plan.amount.toLocaleString('vi-VN')} VND`,
  note:
    plan.id === 'star-50'
      ? 'Nạp thêm cho vote chart, mở nhạc mới và các lượt tải nhẹ.'
      : plan.id === 'star-120'
        ? 'Phù hợp user nghe thường xuyên, vote nhiều và theo dõi community remix.'
        : 'Dành cho super fan, curator playlist và người muốn mở khóa nhiều nội dung hơn.',
}))

const premiumLibrary = [
  { title: 'Exclusive Drop: Neon Viper Afterhours', meta: 'Mở khóa bằng sao hoặc premium pass', status: 'Sẵn sàng mở ngay khi đủ sao' },
  { title: 'Community-only Remix Pack', meta: 'Kho remix dành cho fan hoạt động đều', status: 'Ưu tiên user quay lại nhận thưởng mỗi ngày' },
  { title: 'Weekend Secret Playlist', meta: 'Nội dung dành cho nhóm theo dõi artist spotlight', status: 'Có thể mở bằng sao thưởng hoặc sao nạp' },
]

const missions = [
  'Đăng nhập lại mỗi ngày sau 12AM để nhận +10 sao nhiệm vụ hằng ngày.',
  'Khi đã dùng hết sao trong ngày, hãy quay lại sau 12PM để kiểm tra bonus +5 sao.',
  'Tạo playlist riêng, chia sẻ link và tích lũy lượt nghe để nhận thêm sao cộng đồng.',
  'Vote artist, mở premium track và theo dõi nhiều profile để tăng giá trị tài khoản user.',
]

const dashboardLibrary = [
  ...nonstopTracks.map((track) => ({ ...track, sourceType: 'nonstop' as const, sourceLabel: 'Nonstop picks' })),
  ...remixTracks.map((track) => ({ ...track, sourceType: 'remix' as const, sourceLabel: 'Top remix' })),
]

export function UserDashboardClient({ initialProfile, initialAccessState }: { initialProfile: StoredUserProfile; initialAccessState: UserAccessState }) {
  const searchParams = useSearchParams()
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [rewardMessage, setRewardMessage] = useState('')
  const [premiumAccessUntil, setPremiumAccessUntil] = useState('')
  const [isActivatingPremium, setIsActivatingPremium] = useState(false)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [accessState, setAccessState] = useState<UserAccessState>(initialAccessState)
  const [profile, setProfile] = useState<StoredUserProfile>(initialProfile)
  const [selectedTopupPackageId, setSelectedTopupPackageId] = useState<string>(topUpPlans[0]?.id ?? 'star-50')
  const [selectedTopupProvider, setSelectedTopupProvider] = useState<PaymentProviderId>('bank_qr')
  const [topupMessage, setTopupMessage] = useState('')
  const [topupRequest, setTopupRequest] = useState<StarTopupRequest | null>(null)
  const [isCreatingTopup, setIsCreatingTopup] = useState(false)
  const [referralSummary, setReferralSummary] = useState<ReferralSummary>({ issuedToday: 0, remaining: 10, rewarded: 0, pending: 0, recent: [] })

  useEffect(() => {
    void (async () => {
      const currentPlaylists = getUserPlaylists()
      const stored = currentPlaylists.filter((playlist) => !playlist.id.startsWith('seed-'))
      if (stored.length !== currentPlaylists.length) saveUserPlaylists(stored)
      setPlaylists(stored)
      const shareCode = searchParams.get('playlist')
      const sharedPlaylist = findPlaylistByShareCode(stored, shareCode)
      setSelectedPlaylistId(sharedPlaylist?.id ?? stored[0]?.id ?? '')

      const snapshot = await fetchUserAccessState()
      setAccessState(snapshot.state)
      if (snapshot.profile) setProfile(snapshot.profile)
      if (snapshot.state.isAuthenticated) {
        const premium = await getPremiumAccess()
        setPremiumAccessUntil(premium.premiumAccess?.expiresAt ?? '')
        const referrals = await getReferralSummary()
        if (referrals.summary) setReferralSummary(referrals.summary)
      }
    })()
  }, [searchParams])

  useEffect(() => {
    const refreshReferralRewards = async () => {
      const snapshot = await fetchUserAccessState()
      setAccessState(snapshot.state)
      if (snapshot.profile) setProfile(snapshot.profile)
      if (!snapshot.state.isAuthenticated) return
      const referrals = await getReferralSummary()
      if (referrals.summary) setReferralSummary(referrals.summary)
    }

    const timer = window.setInterval(() => { void refreshReferralRewards() }, 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? playlists[0] ?? null,
    [playlists, selectedPlaylistId]
  )

  const refreshPlaylists = () => {
    setPlaylists(getUserPlaylists())
  }

  const handleClaimDaily = async () => {
    const result = await claimDailyStars()
    setAccessState(result.state)

    if (!result.ok) {
      setRewardMessage('Bạn đã nhận +10 sao hằng ngày hôm nay rồi. Hãy quay lại sau 12AM để nhận tiếp.')
      return
    }

    setRewardMessage('Đã nhận thành công +10 sao nhiệm vụ hằng ngày.')
  }

  const handleClaimBonus = async () => {
    const result = await claimBonusStars()
    setAccessState(result.state)

    if (!result.ok) {
      setRewardMessage('Bonus +5 sao chỉ mở sau 12PM khi bạn đã dùng hết sao hiện có trong ngày.')
      return
    }

    setRewardMessage('Bạn vừa nhận thêm +5 sao bonus. Hãy dùng thật khéo cho lượt vote hoặc mở nhạc tiếp theo.')
  }

  const handleActivatePremium = async () => {
    if (!accessState.isAuthenticated) {
      setRewardMessage('Hãy đăng nhập để mở Premium Drop.')
      return
    }

    setIsActivatingPremium(true)
    try {
      const result = await activatePremiumAccess()
      if (result.state) setAccessState(result.state)
      setPremiumAccessUntil(result.premiumAccess?.expiresAt ?? '')
      if (!result.ok && result.reason === 'insufficient_stars') {
        setShowTopupModal(true)
        return
      }
      setRewardMessage(result.message ?? (result.ok
        ? 'Đã kích hoạt Premium Drop trong 24 giờ.'
        : 'Không thể kích hoạt Premium Drop lúc này.'))
    } catch {
      setRewardMessage('Không thể kết nối để kích hoạt Premium Drop. Vui lòng thử lại.')
    } finally {
      setIsActivatingPremium(false)
    }
  }

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      setShareMessage('Vui lòng nhập tên playlist trước khi tạo.')
      return
    }

    try {
      const created = createUserPlaylist(newPlaylistName)
      if (!created) return
      setNewPlaylistName('')
      setSelectedPlaylistId(created.id)
      setShareMessage(`Đã tạo playlist "${created.name}".`)
      refreshPlaylists()
    } catch {
      setShareMessage('Trình duyệt không thể lưu playlist. Hãy kiểm tra quyền lưu dữ liệu hoặc xóa bớt playlist cũ.')
    }
  }

  const handleAddTrack = (trackIndex: number) => {
    if (!selectedPlaylist) return
    const track = dashboardLibrary[trackIndex]
    addTrackToPlaylist(selectedPlaylist.id, track, track.sourceType)
    setShareMessage(`Đã thêm "${track.title}" vào ${selectedPlaylist.name}.`)
    refreshPlaylists()
  }

  const handleRemoveTrack = (playlistId: string, trackId: string, trackTitle: string) => {
    removeTrackFromPlaylist(playlistId, trackId)
    setShareMessage(`Đã xoá "${trackTitle}" khỏi playlist.`)
    refreshPlaylists()
  }

  const handleCopyShare = async (playlist: UserPlaylist) => {
    if (typeof window === 'undefined') return
    setShareMessage('Đang đồng bộ playlist để chia sẻ...')
    const published = await publishUserPlaylist(playlist)
    if (!published.ok) {
      setShareMessage(published.message)
      return
    }
    const shareUrl = `${window.location.origin}${buildPlaylistSharePath(playlist.shareCode)}`

    const copied = await copyText(shareUrl)
    setShareMessage(copied
      ? `Đã copy link chia sẻ cho "${playlist.name}".`
      : `Không thể tự sao chép. Link playlist: ${shareUrl}`)
  }

  const handleReferralShare = async () => {
    if (!accessState.isAuthenticated) {
      setRewardMessage('Hãy đăng nhập để tạo link chia sẻ có thể nhận sao.')
      return
    }

    const result = await createReferralShareUrl('/music')
    if (!result.ok || !result.url) {
      setRewardMessage(result.message ?? 'Không thể tạo link chia sẻ lúc này.')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: '9LIFE Music', text: 'Khám phá nhạc nightlife trên 9LIFE MAG', url: result.url })
      } catch {
        return
      }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(result.url)
    }

    const summary = await getReferralSummary()
    if (summary.summary) setReferralSummary(summary.summary)
    setRewardMessage('Link chia sẻ đã sẵn sàng. Bạn nhận +10 sao khi có một lượt truy cập độc lập ở lại tối thiểu 30 giây.')
  }

  const handleCreateTopupRequest = async (packageId: string, provider: PaymentProviderId = selectedTopupProvider) => {
    if (!accessState.isAuthenticated) {
      setTopupMessage('Bạn cần đăng nhập trước khi tạo yêu cầu nạp sao.')
      return
    }

    setIsCreatingTopup(true)
    setTopupMessage('')

    try {
      const response = await fetch('/api/cms/star-topups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          packageId,
          provider,
          note: 'User tạo yêu cầu nạp sao từ dashboard ngoài site.',
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message?: string
        snapshot?: {
          requests: StarTopupRequest[]
        }
      }

      if (!result.ok || !result.snapshot?.requests?.length) {
        setTopupMessage(result.message ?? 'Không thể tạo yêu cầu nạp sao lúc này.')
        return
      }

      const latestRequest = result.snapshot.requests[0] ?? null
      setTopupRequest(latestRequest)
      setTopupMessage(
        latestRequest?.provider === 'bank_qr'
          ? 'Đã tạo QR nạp sao. Sau khi bạn chuyển khoản, đội vận hành sẽ đối soát và cộng sao vào tài khoản.'
          : 'Đã tạo yêu cầu thanh toán. Bạn có thể mở link provider để tiếp tục và chờ đối soát.'
      )
    } finally {
      setIsCreatingTopup(false)
    }
  }

  const userStats = [
    {
      label: 'Sao hiện có',
      value: String(accessState.stars),
      detail: accessState.isAuthenticated
        ? 'Bao gồm sao đăng ký, sao daily, bonus và phần thưởng user đang tích lũy.'
        : 'Kích hoạt tài khoản để nhận 100 sao ban đầu.',
    },
    {
      label: 'Nhiệm vụ daily',
      value: accessState.canClaimDaily ? '+10' : accessState.hasClaimedDailyToday ? 'Đã nhận' : 'Chưa mở',
      detail: 'Daily reset lúc 12AM mỗi ngày. User quay lại đăng nhập là có thể nhận thêm sao.',
    },
    {
      label: 'Bonus sau 12PM',
      value: accessState.canClaimBonus ? '+5' : accessState.hasClaimedBonusToday ? 'Đã nhận' : 'Chờ mở',
      detail: 'Bonus chỉ hiện khi bạn đã dùng hết sao đang có và đã nhận daily của ngày đó.',
    },
    {
      label: 'Playlist economy',
      value: String(playlists.length).padStart(2, '0'),
      detail: 'Tạo playlist, thêm track và chia sẻ link để kéo thêm lượt nghe cộng đồng.',
    },
  ]

  const starSources = [
    { label: 'Đăng ký mới', value: accessState.starSources.signup, tone: 'gold' },
    { label: 'Nhiệm vụ daily', value: accessState.starSources.daily, tone: 'blue' },
    { label: 'Bonus', value: accessState.starSources.bonus, tone: 'pink' },
    { label: 'Playlist', value: accessState.starSources.playlist, tone: 'green' },
    { label: 'Chia sẻ hợp lệ', value: accessState.starSources.share, tone: 'pink' },
  ]

  const walletGuides = [
    'Đăng ký hoặc kích hoạt tài khoản thành công sẽ nhận ngay 100 sao để bắt đầu dùng hệ sinh thái.',
    'Mỗi ngày sau 12AM có thể quay lại dashboard để nhận thêm +10 sao nhiệm vụ hằng ngày.',
    'Khi đã dùng hết sao hiện có trong ngày, sau 12PM hệ thống sẽ mở thêm bonus +5 sao để user quay lại nhận.',
  ]

  const bonusNeedsWait =
    accessState.isAuthenticated &&
    accessState.hasClaimedDailyToday &&
    !accessState.hasClaimedBonusToday &&
    accessState.stars <= 0 &&
    !accessState.isPastNoon

  const showBonusButton =
    accessState.canClaimBonus || bonusNeedsWait || accessState.hasClaimedBonusToday

  const bonusAnnouncement = accessState.canClaimBonus
    ? 'Bonus +5 sao đang mở. Bạn có thể nhận ngay trong dashboard.'
    : bonusNeedsWait
      ? 'Bạn đã dùng hết sao hôm nay. Bonus +5 sao sẽ mở sau 12PM, hãy quay lại nhận.'
      : accessState.hasClaimedBonusToday
        ? 'Bạn đã nhận bonus hôm nay rồi. Hệ thống sẽ xét bonus mới vào ngày tiếp theo.'
        : 'Khi dùng hết 100 sao đăng ký và 10 sao daily, dashboard sẽ bật thông báo bonus để bạn quay lại nhận.'

  const isOutOfStars = accessState.isAuthenticated && accessState.stars <= 0
  const accountLabel = profile.fullName?.trim() || profile.email || 'thành viên 9LIFE'
  const followedArtistCards = accessState.followedArtists.map((slug) => ({
    slug,
    name: slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
  }))

  return (
    <main className="user-dashboard-page">
      <section className="user-dashboard-hero">
        <div className="container user-dashboard-hero-row">
          <div>
            <p className="section-eyebrow">Chào mừng, {accountLabel}{profile.email && profile.fullName ? ` (${profile.email})` : ''}</p>
            <h1>User có thể nghe nhạc, vote, tạo playlist và vận hành ví sao thông minh</h1>
            <p className="section-intro">
              Dashboard này gom toàn bộ hoạt động user vào một chỗ: sao đăng ký, daily reward, bonus quay lại, playlist economy,
              premium access và các hành vi cộng đồng giúp tài khoản có thêm giá trị theo thời gian.
            </p>
          </div>

          <div className="artist-dashboard-hero-actions">
            <Link href="/music" className="button">Mở music ngay</Link>
            <Link href="/dat-ban" className="button-secondary">Đi đến đặt bàn</Link>
            <DashboardLogoutButton accountType="user" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container user-dashboard-stats">
          {userStats.map((item) => (
            <article key={item.label} className="user-dashboard-stat">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="container user-dashboard-star-disclaimer">
          <em>
            Sao là đơn vị điểm nội bộ được phát hành để thử nghiệm và vận hành các tính năng cộng đồng của 9life Mag. Sao không phải tiền tệ, không có giá trị quy đổi thành tiền mặt, không được mua bán hoặc chuyển nhượng ngoài phạm vi hệ thống và có thể được điều chỉnh theo chính sách vận hành.
          </em>
        </div>
        <div className="container" id="premium-drop">
          <article className="user-dashboard-premium-drop">
            <div>
              <p className="section-eyebrow">Premium Drop</p>
              <h2>Mở kho nội dung đặc biệt trong 24 giờ</h2>
              <p>Dùng 10 sao để mở các track, nonstop, album và playlist được gắn Premium Drop. Thành viên VIP Community được truy cập trọn tháng.</p>
            </div>
            <div className="user-dashboard-premium-drop-actions">
              <strong>{premiumAccessUntil ? `Đã mở đến ${new Date(premiumAccessUntil).toLocaleString('vi-VN')}` : '10 sao / 24 giờ'}</strong>
              <button type="button" className="button" disabled={isActivatingPremium} onClick={() => void handleActivatePremium()}>
                {isActivatingPremium ? 'Đang kích hoạt...' : premiumAccessUntil ? 'Kiểm tra quyền Premium' : 'Kích hoạt Premium 24h'}
              </button>
            </div>
          </article>
          {rewardMessage ? <p className="user-dashboard-premium-drop-message">{rewardMessage}</p> : null}
        </div>
      </section>

      <section className="section user-dashboard-referral-section">
        <div className="container">
          <article className="artist-dashboard-panel user-dashboard-referral-panel">
            <div className="artist-dashboard-panel-head">
              <div>
                <p className="section-eyebrow">Community referral</p>
                <h2>Chia sẻ có xác thực, nhận +10 sao</h2>
                <p className="artist-editor-panel-note">Còn {referralSummary.remaining}/10 lượt hôm nay. Sao chỉ được cộng khi người khác mở link và ở lại tối thiểu 30 giây.</p>
              </div>
              <button type="button" className="button" onClick={() => void handleReferralShare()}>Chia sẻ 9LIFE Music</button>
            </div>
              <div className="user-dashboard-star-source-grid">
              <div className="user-dashboard-star-source user-dashboard-star-source-gold"><strong>{referralSummary.issuedToday}/10</strong><span>Link hôm nay</span></div>
              <div className="user-dashboard-star-source user-dashboard-star-source-blue"><strong>{referralSummary.pending}</strong><span>Đang chờ xác thực</span></div>
              <div className="user-dashboard-star-source user-dashboard-star-source-green"><strong>{referralSummary.rewarded}</strong><span>Lượt đã nhận sao</span></div>
              </div>
            <div className="account-benefit-list user-dashboard-referral-rules">
              <div className="account-benefit-item"><span className="account-benefit-dot" /><span>Mỗi nội dung chỉ tạo một link thưởng mỗi ngày; không thể dùng cùng một link để nhận sao nhiều lần.</span></div>
              <div className="account-benefit-item"><span className="account-benefit-dot" /><span>Link playlist cá nhân không thuộc chương trình thưởng chia sẻ.</span></div>
              <div className="account-benefit-item"><span className="account-benefit-dot" /><span>Không tính lượt mở của chính chủ link; mỗi link chỉ nhận tối đa +10 sao từ một lượt truy cập độc lập hợp lệ.</span></div>
            </div>
            {referralSummary.recent.length ? <div className="user-dashboard-referral-list">{referralSummary.recent.map((item) => <div key={item.id}><span>{item.path}</span><strong>{item.status === 'rewarded' ? '+10 sao' : item.status === 'visited' ? 'Đang xác thực' : 'Chờ truy cập'}</strong></div>)}</div> : null}
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container user-dashboard-main">
          <div className="user-dashboard-column">
            <article id="star-wallet" className="artist-dashboard-panel user-dashboard-wallet-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Star Wallet</p>
                  <h2>100 sao đăng ký, daily +10 và bonus +5 sau 12PM</h2>
                </div>
              </div>

              <div className="user-dashboard-wallet-grid">
                <div className="user-dashboard-wallet-card">
                  <span className="user-dashboard-wallet-kicker">Đăng ký thành công</span>
                  <strong>100 sao khởi tạo</strong>
                  <p>Tài khoản user mới được cấp 100 sao để bắt đầu vote, mở nhạc và tham gia economy của nền tảng.</p>
                </div>
                <div className="user-dashboard-wallet-card">
                  <span className="user-dashboard-wallet-kicker">Nhịp nhận thưởng hằng ngày</span>
                  <strong>+10 daily / +5 bonus</strong>
                  <p>Daily mở sau 12AM. Bonus mở sau 12PM khi bạn đã dùng hết sao hiện có và đã nhận daily trong ngày.</p>
                </div>
              </div>

              <div className="user-dashboard-star-source-grid" aria-label="Nguồn sao đã kiếm được">
                {starSources.map((source) => (
                  <div key={source.label} className={`user-dashboard-star-source user-dashboard-star-source-${source.tone}`}>
                    <strong>+{source.value}</strong>
                    <span>{source.label}</span>
                  </div>
                ))}
              </div>

              <div className="account-benefit-list">
                {walletGuides.map((item) => (
                  <div key={item} className="account-benefit-item">
                    <span className="account-benefit-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="user-dashboard-reward-panel">
                <div className="user-dashboard-reward-summary">
                  <strong>{accessState.stars} sao khả dụng</strong>
                  <p>{bonusAnnouncement}</p>
                </div>

                <div className="user-dashboard-reward-actions">
                  <button
                    type="button"
                    className={accessState.canClaimDaily ? 'button' : 'button-secondary'}
                    onClick={() => void handleClaimDaily()}
                    disabled={!accessState.canClaimDaily}
                  >
                    Nhận daily +10 sao
                  </button>
                  {showBonusButton ? (
                    <button
                      type="button"
                      className={accessState.canClaimBonus ? 'button' : 'button-secondary'}
                      onClick={() => void handleClaimBonus()}
                      disabled={!accessState.canClaimBonus}
                    >
                      Nhận bonus +5 sao
                    </button>
                  ) : null}
                  {isOutOfStars ? (
                    <button
                      type="button"
                      className="button"
                      onClick={() => void handleCreateTopupRequest(selectedTopupPackageId)}
                      disabled={isCreatingTopup}
                    >
                      {isCreatingTopup ? 'Đang tạo QR...' : 'Nạp sao ngay'}
                    </button>
                  ) : null}
                </div>

                {rewardMessage ? <p className="user-dashboard-playlist-message">{rewardMessage}</p> : null}
                {topupMessage ? <p className="user-dashboard-playlist-message">{topupMessage}</p> : null}
              </div>

              <div className="user-dashboard-topup-mobile-tabs" role="tablist" aria-label="Chọn gói sao">
                {topUpPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`user-dashboard-topup-mobile-tab ${selectedTopupPackageId === plan.id ? 'user-dashboard-topup-mobile-tab-active' : ''}`}
                    role="tab"
                    aria-selected={selectedTopupPackageId === plan.id}
                    onClick={() => setSelectedTopupPackageId(plan.id)}
                  >
                    {plan.stars} sao
                  </button>
                ))}
              </div>

              <div className="user-dashboard-topup-grid">
                {topUpPlans.map((plan) => (
                  <article key={plan.title} className={`user-dashboard-topup-card ${selectedTopupPackageId === plan.id ? '' : 'user-dashboard-topup-card-mobile-hidden'}`}>
                    <strong>{plan.title}</strong>
                    <span>{plan.price}</span>
                    <p>{plan.note}</p>
                    <div className="user-dashboard-topup-provider">
                      <select
                        value={selectedTopupPackageId === plan.id ? selectedTopupProvider : 'bank_qr'}
                        onChange={(event) => {
                          setSelectedTopupPackageId(plan.id)
                          setSelectedTopupProvider(event.target.value as PaymentProviderId)
                        }}
                      >
                        {paymentProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setSelectedTopupPackageId(plan.id)
                        void handleCreateTopupRequest(plan.id, selectedTopupProvider)
                      }}
                      disabled={!accessState.isAuthenticated || isCreatingTopup}
                    >
                      {isCreatingTopup && selectedTopupPackageId === plan.id ? 'Đang tạo...' : 'Nạp gói này'}
                    </button>
                  </article>
                ))}
              </div>

              {topupRequest ? (
                <div className="user-dashboard-topup-result">
                  <div>
                    <strong>{topupRequest.transactionRef}</strong>
                    {topupRequest.providerOrderId ? <span>{topupRequest.providerOrderId}</span> : null}
                    <p>{topupRequest.providerMessage}</p>
                  </div>
                  {topupRequest.qrUrl ? (
                    <div className="user-dashboard-topup-qr">
                      <img src={topupRequest.qrUrl} alt={`QR ${topupRequest.transactionRef}`} />
                    </div>
                  ) : null}
                  {topupRequest.actionUrl ? (
                    <a href={topupRequest.actionUrl} target="_blank" rel="noreferrer" className="button-secondary">
                      Mở thanh toán
                    </a>
                  ) : null}
                </div>
              ) : null}
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Followed Artists</p>
                  <h2>Nghệ sĩ user đang theo dõi</h2>
                </div>
              </div>

              <div className="user-dashboard-follow-grid">
                {followedArtistCards.map((artist) => (
                  <article key={artist.slug} className="user-dashboard-follow-card">
                    <strong>{artist.name}</strong>
                    <span>Đang theo dõi</span>
                    <p>Mở hồ sơ để xem nội dung và lịch hoạt động mới nhất.</p>
                    <div className="user-dashboard-follow-footer">
                      <span>Đã lưu vào tài khoản</span>
                      <Link href={`/nghe-si/${artist.slug}`} className="mini-button">Mở profile</Link>
                    </div>
                  </article>
                ))}
                {!followedArtistCards.length ? <p className="muted">Bạn chưa theo dõi nghệ sĩ nào.</p> : null}
              </div>
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Playlist Economy</p>
                  <h2>Tạo playlist, thêm nhạc và chia sẻ link community</h2>
                </div>
              </div>

              <Link href="/music/library#playlist-manager" className="button-secondary user-dashboard-library-link">
                Quản lý trong Thư viện Music
              </Link>
              <p className="user-dashboard-playlist-earned">Đã cộng vào ví: <strong>+{accessState.starSources.playlist} sao từ playlist</strong></p>

              <div className="user-dashboard-playlist-tools">
                <div className="user-dashboard-playlist-create">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    placeholder="Tên playlist mới"
                  />
                  <button type="button" className="button" onClick={handleCreatePlaylist}>
                    Tạo playlist
                  </button>
                </div>

                <div className="user-dashboard-playlist-select">
                  <span>Playlist đang thao tác</span>
                  <select value={selectedPlaylistId} onChange={(event) => setSelectedPlaylistId(event.target.value)}>
                    {playlists.map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                </div>

                {shareMessage ? <p className="user-dashboard-playlist-message">{shareMessage}</p> : null}
              </div>

              <div className="user-dashboard-playlist-grid user-dashboard-playlist-grid-expanded">
                {playlists.map((playlist) => {
                  const sharePath = buildPlaylistSharePath(playlist.shareCode)
                  const isSelected = selectedPlaylist?.id === playlist.id

                  return (
                    <article
                      key={playlist.id}
                      className={
                        isSelected
                          ? 'user-dashboard-playlist-card user-dashboard-playlist-card-active'
                          : 'user-dashboard-playlist-card'
                      }
                    >
                      <div className="user-dashboard-playlist-head">
                        <div>
                          <strong>{playlist.name}</strong>
                          <span>{playlist.listens.toLocaleString('en-US')} lượt nghe • +{playlist.rewardStars} sao</span>
                        </div>
                        <button type="button" className="mini-button" onClick={() => setSelectedPlaylistId(playlist.id)}>
                          Chọn
                        </button>
                      </div>

                      <p>{playlist.note}</p>
                      <p className="user-dashboard-playlist-stats">Tạo ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(playlist.createdAt))} · {playlist.favorites ?? 0} yêu thích · +{playlist.rewardStars} sao</p>

                      <div className="user-dashboard-playlist-share">
                        <input value={sharePath} readOnly />
                        <button type="button" className="mini-button" onClick={() => void handleCopyShare(playlist)}>
                          Copy link
                        </button>
                      </div>

                      <div className="user-dashboard-playlist-items">
                        {playlist.items.length === 0 ? (
                          <div className="user-dashboard-playlist-empty">Chưa có track nào. Hãy thêm từ player hoặc từ danh sách có sẵn bên dưới.</div>
                        ) : (
                          playlist.items.map((item) => (
                            <div key={`${playlist.id}-${item.id}`} className="user-dashboard-playlist-item">
                              <div>
                                <strong>{item.title}</strong>
                                <span>{item.artist} • {item.sourceType}</span>
                              </div>
                              <button
                                type="button"
                                className="mini-button"
                                onClick={() => handleRemoveTrack(playlist.id, item.id, item.title)}
                              >
                                Xoá
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="user-dashboard-library-picker">
                <div className="artist-dashboard-panel-head">
                  <div>
                    <p className="section-eyebrow">Add From Library</p>
                    <h2>Chọn track/nonstop có sẵn để thêm vào playlist</h2>
                  </div>
                </div>

                <div className="user-dashboard-library-grid">
                  {dashboardLibrary.map((track, index) => (
                    <article key={track.id} className="user-dashboard-library-card">
                      <div>
                        <strong>{track.title}</strong>
                        <span>{track.artist}</span>
                        <p>{track.sourceLabel} • {track.duration}</p>
                      </div>
                      <button
                        type="button"
                        className="button-secondary button-secondary-compact"
                        onClick={() => handleAddTrack(index)}
                        disabled={!selectedPlaylist}
                      >
                        Thêm vào playlist
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <aside className="user-dashboard-side">
            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Star Notice</p>
                  <h2>Thông báo sao cho user</h2>
                </div>
              </div>

              <div className="artist-dashboard-update-list">
                <div className="artist-dashboard-update-item">
                  <span className="account-benefit-dot" />
                  <p>
                    <strong>Daily sau 12AM</strong>
                    <br />
                    {accessState.hasClaimedDailyToday
                      ? 'Bạn đã nhận +10 sao hôm nay rồi. Hệ thống sẽ reset quyền nhận vào 12AM ngày mới.'
                      : 'Bạn chưa nhận daily hôm nay. Hãy quay lại dashboard để lấy +10 sao ngay khi muốn.'}
                  </p>
                </div>
                <div className="artist-dashboard-update-item">
                  <span className="account-benefit-dot" />
                  <p>
                    <strong>Bonus sau 12PM</strong>
                    <br />
                    {bonusAnnouncement}
                  </p>
                </div>
              </div>
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Premium & Downloads</p>
                  <h2>Kho quyền truy cập</h2>
                </div>
              </div>

              <div className="user-dashboard-premium-list">
                {premiumLibrary.map((item) => (
                  <div key={item.title} className="user-dashboard-premium-item">
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                    <p>{item.status}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="artist-dashboard-panel">
              <div className="artist-dashboard-panel-head">
                <div>
                  <p className="section-eyebrow">Community Missions</p>
                  <h2>Nhiệm vụ kiếm sao</h2>
                </div>
              </div>

              <div className="account-benefit-list">
                {missions.map((item) => (
                  <div key={item} className="account-benefit-item">
                    <span className="account-benefit-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
      <StarTopupDialog open={showTopupModal} onClose={() => setShowTopupModal(false)} />
    </main>
  )
}
