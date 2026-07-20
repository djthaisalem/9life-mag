'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock3, MapPin, Star, Users2 } from 'lucide-react'
import { clubOutlets, regionalOutlets } from '@/lib/club-booking-data'
import { fetchUserAccessState, loginDemoUser, spendUserStars } from '@/lib/client-user-access'

const DEFAULT_VISIBLE = 6

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

function shuffleItems<T>(items: readonly T[]) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
  }
  return next
}

function TableBookingContent() {
  const searchParams = useSearchParams()
  const activeLocation = searchParams.get('location')
  const [expandedRegions, setExpandedRegions] = useState<string[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [starBalance, setStarBalance] = useState(0)
  const [showVoteLogin, setShowVoteLogin] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [pendingOutletVote, setPendingOutletVote] = useState<string | null>(null)
  const [outletVotes, setOutletVotes] = useState<Record<string, number>>(outletVoteSeed)
  const [votedOutletSlugs, setVotedOutletSlugs] = useState<string[]>([])
  const [featuredClubs] = useState(() =>
    regionalOutlets
      .map((region) => shuffleItems(region.outlets)[0])
      .filter((club): club is (typeof regionalOutlets)[number]['outlets'][number] => Boolean(club))
  )

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setStarBalance(snapshot.state.stars)
    })()
  }, [])

  const locationOptions = useMemo(
    () => [...new Set(clubOutlets.map((outlet) => outlet.city))].sort((left, right) => left.localeCompare(right, 'vi')),
    []
  )

  const randomizedRegions = useMemo(
    () =>
      regionalOutlets
        .map((region) => {
          const filteredOutlets = activeLocation
            ? region.outlets.filter((outlet) => outlet.city === activeLocation)
            : region.outlets

          return {
            ...region,
            outlets: shuffleItems(filteredOutlets),
          }
        })
        .filter((region) => region.outlets.length > 0),
    [activeLocation]
  )

  const handleOutletVote = async (slug: string) => {
    const result = await spendUserStars(1, 'vote')

    if (!result.ok) {
      if (result.reason === 'not_authenticated') {
        setPendingOutletVote(slug)
        setShowVoteLogin(true)
        return
      }

      window.alert('Bạn không đủ sao để vote outlet. Hãy nạp thêm sao trong tài khoản.')
      return
    }

    setStarBalance(result.state.stars)
    setOutletVotes((prev) => ({ ...prev, [slug]: (prev[slug] ?? 0) + 1 }))
    setVotedOutletSlugs((current) => (current.includes(slug) ? current : [...current, slug]))
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

    if (pendingOutletVote) {
      const queuedVote = pendingOutletVote
      setPendingOutletVote(null)
      window.setTimeout(() => void handleOutletVote(queuedVote), 0)
    }
  }

  return (
    <main className="club-booking-page">
      <section className="home-section">
        <div className="container">
          <div className="home-section-head club-booking-head">
            <div>
              <p className="eyebrow">Table Booking</p>
              <h1 className="home-title">
                Đặt bàn <span>night club</span> theo khu vực và location
              </h1>
              <p className="page-intro club-booking-intro">
                Khu này dành cho người dùng muốn chọn venue nhanh: trên cùng là spotlight club nổi bật, bên dưới là outlet
                chia theo miền và có thể lọc tiếp theo từng thành phố như Hà Nội, TP.HCM, Đà Nẵng... Mỗi lần vào trang,
                danh sách club sẽ được xáo ngẫu nhiên để trải nghiệm khám phá luôn mới hơn.
              </p>
            </div>
          </div>

          <div className="club-booking-slider">
            {featuredClubs.map((club) => (
              <Link key={club.slug} href={`/dat-ban/${club.slug}`} className="headline-slide club-booking-slide">
                <img src={club.image} alt={club.name} className="headline-slide-image" />
                <div className="headline-slide-overlay" />
                <div className="headline-slide-copy">
                  <div className="tag-row">
                    <Link href={`/dat-ban?location=${encodeURIComponent(club.city)}`} className="pill">
                      {club.city}
                    </Link>
                    <span className="pill">{club.vibe}</span>
                  </div>
                  <h3>{club.name}</h3>
                  <p className="club-featured-location">{club.city}</p>
                  <p>{club.summary}</p>
                  <span className="more-link-unified">Xem profile outlet</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="club-region-menu">
            <Link href="/dat-ban" className={activeLocation ? 'artist-filter-chip' : 'artist-filter-chip artist-filter-chip-active'}>
              Tất cả location
            </Link>
            {locationOptions.map((location) => (
              <Link
                key={location}
                href={`/dat-ban?location=${encodeURIComponent(location)}`}
                className={activeLocation === location ? 'artist-filter-chip artist-filter-chip-active' : 'artist-filter-chip'}
              >
                {location}
              </Link>
            ))}
          </div>

          {!activeLocation ? (
            <div className="club-region-menu">
              {randomizedRegions.map((region) => (
                <a key={region.id} href={`#${region.id}`} className="artist-filter-chip">
                  {region.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="container club-outlet-sections">
          {randomizedRegions.map((region) => {
            const isExpanded = expandedRegions.includes(region.id)
            const visibleOutlets = isExpanded ? region.outlets : region.outlets.slice(0, DEFAULT_VISIBLE)
            const hasMore = region.outlets.length > DEFAULT_VISIBLE
            const sectionTitle = activeLocation ? `${activeLocation} â€¢ ${region.label}` : region.label

            return (
              <section key={region.id} id={region.id} className="club-region-section">
                <div className="home-section-head">
                  <div>
                    <p className="section-eyebrow">Outlet by location</p>
                    <h2 className="home-title">{sectionTitle}</h2>
                  </div>
                  {hasMore ? (
                    <button
                      type="button"
                      className="more-link-unified"
                      onClick={() =>
                        setExpandedRegions((current) =>
                          current.includes(region.id) ? current : [...current, region.id]
                        )
                      }
                    >
                      {isExpanded ? `Đã hiện tất cả club ${sectionTitle}` : `Xem thêm club ${sectionTitle}`}
                    </button>
                  ) : null}
                </div>

                <div className="club-outlet-grid">
                  {visibleOutlets.map((outlet) => (
                    <article key={outlet.slug} className="club-outlet-card">
                      <Link href={`/dat-ban/${outlet.slug}`} className="club-outlet-image-link">
                        <img src={outlet.image} alt={outlet.name} className="club-outlet-image" />
                      </Link>

                      <div className="club-outlet-top">
                        <div>
                          <h3>{outlet.name}</h3>
                          <p>{outlet.type}</p>
                        </div>
                        <span className="club-outlet-badge">
                          <Star size={14} />
                          Featured
                        </span>
                      </div>

                      <div className="club-outlet-meta">
                        <Link href={`/dat-ban?location=${encodeURIComponent(outlet.city)}`} className="club-location-link">
                          <MapPin size={15} /> {outlet.city}
                        </Link>
                        <span><Clock3 size={15} /> {outlet.hours}</span>
                        <span><Users2 size={15} /> {outlet.crowd}</span>
                      </div>

                      <div className="club-outlet-vote">
                        <strong>{(outletVotes[outlet.slug] ?? 0).toLocaleString('en-US')}</strong>
                        <span>community votes</span>
                      </div>

                      <div className="club-outlet-actions">
                        <Link href={`/dat-ban/yeu-cau?outlet=${outlet.slug}`} className="button">
                          Đặt bàn
                        </Link>
                        <button
                          type="button"
                          className={votedOutletSlugs.includes(outlet.slug) ? 'button-secondary button-secondary-highlighted' : 'button-secondary'}
                          onClick={() => void handleOutletVote(outlet.slug)}
                        >
                          Vote outlet
                        </button>
                        <Link href={`/dat-ban/${outlet.slug}`} className="more-link-unified">
                          Xem profile
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>

      {showVoteLogin ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true">
          <div className="login-gate-card">
            <div className="player-kicker">Đăng nhập để vote outlet</div>
            <h3>Vote outlet sẽ trừ 1 sao từ ví user</h3>
            <p className="muted">
              {isAuthenticated
                ? `Bạn hiện còn ${starBalance} sao để dùng cho vote artist, outlet và mở kho nhạc premium.`
                : 'Hãy đăng nhập trước để hệ thống trừ sao hợp lý khi bạn vote cho outlet yêu thích.'}
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
    </main>
  )
}

export default function TableBookingPage() {
  return (
    <Suspense fallback={<main className="club-booking-page" />}>
      <TableBookingContent />
    </Suspense>
  )
}

