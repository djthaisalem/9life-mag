'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarCheck2, Eye, Heart, Mic2, Radio, Sparkles, Star, Users2 } from 'lucide-react'
import { ArtistDirectoryArticleSlider } from '@/components/artist-directory-article-slider'
import { artistProfiles } from '@/lib/artist-directory-data'
import {
  buildArtistDirectoryHref,
  defaultArtistDirectoryFilters,
  filterArtistsByDirectoryFilters,
  parseArtistDirectoryFilters,
  type ArtistDirectoryFilters,
} from '@/lib/artist-segments'
import { fetchUserAccessState, spendUserStars, toggleFollowedArtist } from '@/lib/client-user-access'
import { getFairRotation } from '@/lib/music-curation'

const artistDisplayOverrides: Record<string, Partial<Record<'location' | 'rate', string>>> = {
  'kai-motion': {
    location: 'Hà Nội',
    rate: 'Từ 12.000.000 VND',
  },
}

const artistCategoryTabs = [
  { label: 'Tất cả talent', value: 'all' },
  { label: 'DJ', value: 'dj' },
  { label: 'MC Hype', value: 'mc' },
  { label: 'Rapper', value: 'rapper' },
  { label: 'Dancer', value: 'dancer' },
  { label: 'Photographer', value: 'photographer' },
  { label: 'Model', value: 'model' },
  { label: 'Designer', value: 'designer' },
] as const

const artistGenderTabs = [
  { label: 'Tất cả giới tính', value: 'all' },
  { label: 'Nữ', value: 'female' },
  { label: 'Nam', value: 'male' },
] as const

function ArtistsPageContent() {
  const searchParams = useSearchParams()
  const [activeFilters, setActiveFilters] = useState<ArtistDirectoryFilters>(defaultArtistDirectoryFilters)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [followedArtists, setFollowedArtists] = useState<string[]>([])
  const [votedArtists, setVotedArtists] = useState<string[]>([])
  const [accessPrompt, setAccessPrompt] = useState<'vote' | 'follow' | null>(null)
  const [artistOrder, setArtistOrder] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      const snapshot = await fetchUserAccessState()
      setIsAuthenticated(snapshot.state.isAuthenticated)
      setFollowedArtists(snapshot.state.followedArtists)
    })()
  }, [])

  useEffect(() => {
    setActiveFilters(parseArtistDirectoryFilters(searchParams))
  }, [searchParams])

  const visibleArtists = useMemo(
    () => filterArtistsByDirectoryFilters(artistProfiles, activeFilters),
    [activeFilters],
  )

  const visibleArtistSlugs = visibleArtists.map((artist) => artist.slug).join('|')

  useEffect(() => {
    const artistSlugs = visibleArtists.map((artist) => artist.slug)
    if (!artistSlugs.length) {
      setArtistOrder([])
      return
    }

    const rotationKey = `nine-life-artist-directory-${activeFilters.category}-${activeFilters.gender}-v1`
    const [featuredSlug] = getFairRotation(rotationKey, artistSlugs, 1)
    const followingSlugs = artistSlugs.filter((slug) => slug !== featuredSlug)
    const remainingOrder = getFairRotation(`${rotationKey}-remaining`, followingSlugs, followingSlugs.length)

    setArtistOrder([featuredSlug, ...remainingOrder].filter((slug): slug is string => Boolean(slug)))
  }, [activeFilters.category, activeFilters.gender, visibleArtistSlugs])

  const orderedArtists = useMemo(() => {
    if (!artistOrder.length) return visibleArtists

    const artistBySlug = new Map(visibleArtists.map((artist) => [artist.slug, artist]))
    return artistOrder
      .map((slug) => artistBySlug.get(slug))
      .filter((artist): artist is (typeof artistProfiles)[number] => Boolean(artist))
  }, [artistOrder, visibleArtists])

  const handleFollow = async (slug: string) => {
    if (!isAuthenticated) {
      setAccessPrompt('follow')
      return
    }

    const next = await toggleFollowedArtist(slug)
    setFollowedArtists(next)
  }

  const handleVote = async (slug: string) => {
    const result = await spendUserStars(1, 'vote')

    if (!result.ok) {
      if (result.reason === 'not_authenticated') {
        setAccessPrompt('vote')
        return
      }

      window.alert('Bạn không đủ sao để vote nghệ sĩ. Hãy nạp thêm sao trong tài khoản.')
      return
    }

    setVotedArtists((current) => (current.includes(slug) ? current : [...current, slug]))
  }

  return (
    <main className="artist-directory-page">
      <section className="artist-directory-hero">
        <div className="container artist-directory-hero-grid">
          <div className="artist-directory-copy">
            <p className="section-eyebrow">Artist Directory</p>
            <h1>Hồ sơ nghệ sĩ <span className="artist-directory-title-highlight">chuyên nghiệp</span></h1>
            <p className="section-intro">
              Danh sách talent cho nightlife, event và sân khấu giải trí: DJ, producer, MC hype, rapper, dancer, photographer, model và performer nam nữ,
              sẵn sàng cho booking, collab và editorial spotlight.
            </p>

            <div className="artist-directory-stats">
              <article>
                <Users2 size={18} />
                <strong>120+</strong>
                <span>Hồ sơ đang hoạt động</span>
              </article>
              <article>
                <Radio size={18} />
                <strong>40+</strong>
                <span>DJ & producer</span>
              </article>
              <article>
                <Mic2 size={18} />
                <strong>28+</strong>
                <span>MC hype, rapper & dancer</span>
              </article>
              <article>
                <Sparkles size={18} />
                <strong>VIP</strong>
                <span>Talent spotlight</span>
              </article>
            </div>
          </div>

          <ArtistDirectoryArticleSlider />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="artist-directory-toolbar">
            <div>
              <p className="section-eyebrow">Filter Talent</p>
              <h2>Chọn đúng profile theo format đêm diễn</h2>
            </div>
            <Link href="/booking" className="view-more-link artist-directory-booking-link">
              Gửi booking
            </Link>
          </div>

          <div className="artist-filter-strip">
            {artistCategoryTabs.map((tab) => (
              <Link
                key={tab.value}
                href={buildArtistDirectoryHref({ category: tab.value, gender: activeFilters.gender })}
                className={
                  activeFilters.category === tab.value
                    ? 'artist-filter-chip artist-filter-chip-active'
                    : 'artist-filter-chip'
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="artist-filter-strip artist-filter-strip-secondary">
            {artistGenderTabs.map((tab) => (
              <Link
                key={tab.value}
                href={buildArtistDirectoryHref({ category: activeFilters.category, gender: tab.value })}
                className={
                  activeFilters.gender === tab.value
                    ? 'artist-filter-chip artist-filter-chip-active'
                    : 'artist-filter-chip'
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="artist-profile-grid">
            {orderedArtists.map((artist, index) => {
              const isFollowed = followedArtists.includes(artist.slug)
              const artistOverride = artistDisplayOverrides[artist.slug]
              const displayLocation = artistOverride?.location ?? artist.location
              const displayRate = artistOverride?.rate ?? artist.rate
              const hasVoted = votedArtists.includes(artist.slug)

              return (
                <article
                  key={artist.id}
                  className={index === 0 ? 'artist-profile-card artist-profile-card-featured' : 'artist-profile-card'}
                >
                  <div className="artist-profile-media">
                    <Link href={`/nghe-si/${artist.slug}`} className="artist-profile-image-link" aria-label={`Xem hồ sơ ${artist.name}`}>
                      <img src={artist.image} alt={artist.name} />
                    </Link>
                    <div className="artist-profile-gradient" />
                    <div className="artist-profile-tags">
                      <span className="pill">{artist.role}</span>
                      <span className="pill">{displayLocation}</span>
                    </div>
                  </div>

                  <div className="artist-profile-body">
                    <div className="artist-profile-head">
                      <div>
                        <h3>{artist.name}</h3>
                        <p>{artist.genres}</p>
                      </div>
                      <span className="artist-profile-followers">{artist.followers}</span>
                    </div>

                    <div className="artist-profile-meta">
                      <span>{artist.availability}</span>
                      <strong>{displayRate}</strong>
                    </div>

                    <div className="artist-profile-actions">
                      <Link href={`/nghe-si/${artist.slug}`} className="mini-button">
                        <Eye size={15} />
                        <span>Profile</span>
                      </Link>
                      <Link href={`/booking?artist=${artist.slug}`} className="mini-button mini-button-alt">
                        <CalendarCheck2 size={15} />
                        <span>Booking</span>
                      </Link>
                      <button
                        type="button"
                        className={hasVoted ? 'mini-button artist-directory-vote-button artist-directory-vote-button-active' : 'mini-button artist-directory-vote-button'}
                        onClick={() => void handleVote(artist.slug)}
                        aria-label={`Vote cho ${artist.name}`}
                        title="Vote nghệ sĩ, tốn 1 sao"
                      >
                        <Star size={15} fill={hasVoted ? 'currentColor' : 'none'} />
                        <span>Vote</span>
                      </button>
                      {isAuthenticated ? (
                        <button
                          type="button"
                          className={isFollowed ? 'mini-button mini-button-following' : 'mini-button'}
                          onClick={() => void handleFollow(artist.slug)}
                        >
                          <Heart size={15} fill={isFollowed ? 'currentColor' : 'none'} />
                          <span>{isFollowed ? 'Đã follow' : 'Follow'}</span>
                        </button>
                      ) : (
                        <button type="button" className="mini-button" onClick={() => void handleFollow(artist.slug)} aria-label="Follow nghệ sĩ" title="Follow nghệ sĩ">
                          <Heart size={15} />
                          <span>Follow</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {accessPrompt ? (
        <div className="login-gate-overlay" role="dialog" aria-modal="true" aria-labelledby="artistAccessPromptTitle">
          <div className="login-gate-card artist-directory-access-prompt">
            <div className="player-kicker">Đăng nhập để tiếp tục</div>
            <h3 id="artistAccessPromptTitle">{accessPrompt === 'vote' ? 'Vote nghệ sĩ sẽ trừ 1 sao' : 'Theo dõi nghệ sĩ yêu thích'}</h3>
            <p className="muted">{accessPrompt === 'vote' ? 'Đăng nhập để hệ thống ghi nhận lượt vote và trừ sao từ ví của bạn.' : 'Đăng nhập để lưu nghệ sĩ này vào danh sách theo dõi cá nhân.'}</p>
            <div className="login-gate-actions">
              <button type="button" className="button-secondary" onClick={() => setAccessPrompt(null)}>Để sau</button>
              <Link href="/tai-khoan" className="button">Đăng nhập</Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<main className="artist-directory-page" />}>
      <ArtistsPageContent />
    </Suspense>
  )
}
