'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { featuredArticles } from '@/lib/site-data'
import { newsCategoryChips, newsSignalCards } from '@/lib/news-taxonomy'
import { getFairRotation } from '@/lib/music-curation'
import { newsCatalogSupplement } from '@/lib/news-catalog-supplement'

const legacyFeedArticles = [
  ...featuredArticles,
  {
    slug: 'aftermovie-club-recap-tao-traffic-moi',
    title: 'Aftermovie và recap sau show đang trở thành nguồn traffic mới cho venue',
    category: 'Backstage',
    date: '06.07.2026',
    summary:
      'Không còn chỉ đăng poster, nhiều club đang đầu tư hẳn một vòng nội dung sau sự kiện để kéo người dùng quay lại nền tảng và giữ nhịp tương tác.',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=800&fit=crop',
  },
  {
    slug: 'female-dj-premium-lounge-demand',
    title: 'Nhu cầu female DJ cho premium lounge tăng mạnh trong mùa hè',
    category: 'Artist',
    date: '05.07.2026',
    summary:
      'Các venue cao cấp ưu tiên nghệ sĩ có hình ảnh sáng, set linh hoạt và khả năng phối hợp cùng team social để tạo thêm giá trị cho cùng một booking.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=800&fit=crop',
  },
  {
    slug: 'future-rave-prime-time-2026',
    title: 'Future rave vẫn là lựa chọn prime-time hàng đầu của crowd 2026',
    category: 'Âm nhạc',
    date: '04.07.2026',
    summary:
      'Từ festival đến club set, dòng nhạc này vẫn giữ sức bật nhờ drop rõ, visual hợp và rất dễ tạo cao trào cho khung giờ đông khách.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=800&fit=crop',
  },
  {
    slug: 'mc-dj-duo-format-len-ngoi',
    title: 'MC + DJ duo format đang lên ngôi vì giữ nhịp sàn tốt hơn',
    category: 'Nightlife',
    date: '03.07.2026',
    summary:
      'Những đêm nhạc thiên về trải nghiệm đám đông đang chuộng format phối hợp thay vì để nghệ sĩ hoạt động tách rời, giúp crowd phản hồi đều hơn suốt set.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop',
  },
  {
    slug: 'artist-profile-media-kit-moi',
    title: 'Artist profile giờ không chỉ để đẹp mà còn là media kit để chốt booking',
    category: 'Artist',
    date: '02.07.2026',
    summary:
      'Video, playlist, gallery và rider cơ bản đang dần trở thành bộ thông tin tối thiểu để một profile nghệ sĩ đủ sức thuyết phục venue và agency.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
  },
  {
    slug: 'club-opening-khong-the-thieu-visual',
    title: 'Một đêm opening thành công giờ gần như không thể thiếu visual concept',
    category: 'Backstage',
    date: '01.07.2026',
    summary:
      'Ánh sáng, màu nhận diện, LED drop và góc recap đang quyết định cảm giác cao cấp của cả event chứ không chỉ riêng phần âm nhạc.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=800&fit=crop',
  },
  {
    slug: 'nonstop-picks-social-hook',
    title: 'Playlist nonstop ngắn đang trở thành social hook hiệu quả cho tab music',
    category: 'Xu hướng',
    date: '30.06.2026',
    summary:
      'Người dùng thích cảm giác bấm vào là nghe ngay, rồi mới đi sâu hơn vào track, remix và profile nghệ sĩ liên quan sau đó.',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=800&fit=crop',
  },
  {
    slug: 'rooftop-concept-night-competition',
    title: 'Cuộc đua rooftop concept night đang nóng dần ở các thành phố lớn',
    category: 'Sự kiện',
    date: '29.06.2026',
    summary:
      'Cùng là một đêm nhạc, nhưng venue nào kể được câu chuyện rõ hơn qua line-up và hình ảnh thì thắng thế rõ rệt trên social lẫn booking.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop',
  },
  {
    slug: 'sound-design-tro-thanh-loi-the',
    title: 'Producer có tư duy sound design đang sở hữu lợi thế khác biệt',
    category: 'Artist',
    date: '28.06.2026',
    summary:
      'Không chỉ làm beat, lớp nghệ sĩ mới còn phải tạo được màu âm thanh riêng để dễ gắn với thương hiệu cá nhân và được nhớ lâu hơn.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=800&fit=crop',
  },
  {
    slug: 'venue-membership-nightlife-loyalty',
    title: 'Venue bắt đầu thử mô hình membership để giữ khách nightlife quay lại',
    category: 'Nightlife',
    date: '27.06.2026',
    summary:
      'Không chỉ bán vé từng đêm, nhiều địa điểm đang thử ưu đãi theo mùa và quyền lợi riêng cho nhóm khách trung thành để tăng tần suất quay lại.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop',
  },
  {
    slug: 'dj-residency-giup-xay-cong-dong',
    title: 'DJ residency đang giúp venue xây cộng đồng mạnh hơn các đêm one-off',
    category: 'Artist',
    date: '26.06.2026',
    summary:
      'Khi gương mặt biểu diễn lặp lại theo chuỗi, người xem dễ nhớ và quay lại hơn, kéo theo social recall và mức độ gắn kết tốt hơn.',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&h=800&fit=crop',
  },
  {
    slug: 'social-snippet-truoc-sau-show',
    title: 'Social snippet trước và sau show đang quyết định hiệu quả truyền thông',
    category: 'Backstage',
    date: '25.06.2026',
    summary:
      'Đêm diễn giờ không chỉ sống trên sân khấu mà còn sống tiếp trên video dọc, ảnh recap và các đoạn cắt ngắn cho social.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=800&fit=crop',
  },
] as const

// One source for every card displayed in the feed. Detail pages use the same supplement as a fallback.
const feedArticles = [...legacyFeedArticles, ...newsCatalogSupplement]

const INITIAL_VISIBLE = 4
const LOAD_MORE_STEP = 4

export default function NewsPage() {
  const [activeChip, setActiveChip] = useState<(typeof newsCategoryChips)[number]>('Tất cả')
  const [activeSignal, setActiveSignal] = useState<(typeof newsSignalCards)[number]['key'] | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [activeSlide, setActiveSlide] = useState(0)
  const [topStoryIds, setTopStoryIds] = useState<string[]>([])
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const activeSignalConfig = newsSignalCards.find((item) => item.key === activeSignal) ?? null

  const filteredArticles = useMemo(() => {
    return feedArticles.filter((article) => {
      const matchesChip = activeChip === 'Tất cả' ? true : article.category === activeChip
      const matchesSignal = activeSignalConfig
        ? (activeSignalConfig.categories as readonly string[]).includes(article.category)
        : true
      return matchesChip && matchesSignal
    })
  }, [activeChip, activeSignalConfig])

  const displayArticles = filteredArticles.length ? filteredArticles : feedArticles
  const headlineArticles = displayArticles.slice(0, 3)
  const heroArticle = headlineArticles[activeSlide % headlineArticles.length]
  const topStoryCandidates = displayArticles.slice(3)
  const topStoryCandidateKey = topStoryCandidates.map((article) => article.slug).join('|')
  const topStories = topStoryIds
    .map((slug) => topStoryCandidates.find((article) => article.slug === slug))
    .filter((article): article is (typeof feedArticles)[number] => Boolean(article))
  const displayedTopStories = topStories.length ? topStories : topStoryCandidates.slice(0, 3)
  const storyFeed = displayArticles.length > 6 ? displayArticles.slice(6) : displayArticles.slice(3)
  const visibleStories = storyFeed.slice(0, visibleCount)
  const hasMoreStories = visibleCount < storyFeed.length

  useEffect(() => { setActiveSlide(0) }, [activeChip, activeSignal])
  useEffect(() => {
    const ids = getFairRotation('nine-life-news-top-stories-rotation-v1', topStoryCandidates.map((article) => article.slug), 3)
    setTopStoryIds(ids)
  }, [topStoryCandidateKey])
  useEffect(() => {
    if (headlineArticles.length < 2) return
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % headlineArticles.length), 5200)
    return () => window.clearInterval(timer)
  }, [headlineArticles.length])
  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMoreStories) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, storyFeed.length)) }, { rootMargin: '280px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMoreStories, storyFeed.length])

  useEffect(() => {
    if (!hasMoreStories) return
    const loadWhenNearBottom = () => {
      const threshold = document.documentElement.scrollHeight - window.innerHeight - 320
      if (window.scrollY >= threshold) setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, storyFeed.length))
    }
    window.addEventListener('scroll', loadWhenNearBottom, { passive: true })
    return () => window.removeEventListener('scroll', loadWhenNearBottom)
  }, [hasMoreStories, storyFeed.length])

  return (
    <main className="news-feed-page">
      <section className="home-section">
        <div className="container">
          <div className="home-section-head news-feed-head">
            <div>
              <p className="eyebrow">Nightlife Feed</p>
              <h1 className="home-title">
                Tin tức <span>nightlife</span>, âm nhạc và chuyển động mới của scene giải trí đêm
              </h1>
              <p className="page-intro news-feed-intro">
                Cập nhật nhanh bài nổi bật, xu hướng mới, nghệ sĩ đáng chú ý và venue đang được quan tâm trong một feed biên tập gọn, rõ trọng tâm.
              </p>
            </div>
          </div>

          <div className="news-feed-chip-row">
            {newsCategoryChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={activeChip === chip ? 'artist-filter-chip artist-filter-chip-active' : 'artist-filter-chip'}
                onClick={() => {
                  setActiveChip(chip)
                  setVisibleCount(INITIAL_VISIBLE)
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="news-feed-hero-grid">
            <Link href={`/tin-tuc/${heroArticle.slug}`} className="headline-slide news-feed-hero-card">
              <img src={heroArticle.image} alt={heroArticle.title} className="headline-slide-image" />
              <div className="headline-slide-overlay" />
              <div className="headline-slide-copy">
                <div className="tag-row">
                  <span className="pill">{heroArticle.category}</span>
                  <span className="pill">{heroArticle.date}</span>
                </div>
                <h3>{heroArticle.title}</h3>
                <p>{heroArticle.summary}</p>
                <div className="news-headline-dots">
                  {headlineArticles.map((item, index) => (
                    <button key={item.slug} type="button" aria-label={`Chuyển đến bài ${index + 1}`} className={index === activeSlide ? 'news-headline-dot news-headline-dot-active' : 'news-headline-dot'} onClick={() => setActiveSlide(index)} />
                  ))}
                </div>
                <span className="section-link">Đọc bài nổi bật</span>
              </div>
            </Link>

            <div className="news-feed-signal-list">
              {newsSignalCards.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={activeSignal === item.key ? 'news-feed-signal-card news-feed-signal-card-active' : 'news-feed-signal-card'}
                    onClick={() => {
                      setActiveSignal((current) => (current === item.key ? null : item.key))
                      setVisibleCount(INITIAL_VISIBLE)
                    }}
                  >
                    <div className="news-feed-signal-head">
                      <Icon size={20} />
                      <strong>{item.label}</strong>
                    </div>
                    <span>{item.value}</span>
                    <small>{item.categories.join(' • ')}</small>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt">
        <div className="container">
          <div className="home-section-head">
            <div>
              <p className="section-eyebrow">Top Stories</p>
              <h2 className="home-title">Các bài đang được xem nhiều</h2>
              {activeSignalConfig ? (
                <p className="muted">
                  Đang lọc theo <strong>{activeSignalConfig.label}</strong>. Trong CMS, editor có thể gắn bài vào đúng cụm này qua mục
                  placement cùng tên để đẩy đúng bài lên đầu trang.
                </p>
              ) : null}
            </div>
          </div>

          <div className="news-feed-top-grid">
            {displayedTopStories.map((article) => (
              <Link key={article.slug} href={`/tin-tuc/${article.slug}`} className="news-feed-top-card">
                <img src={article.image} alt={article.title} />
                <div className="news-feed-top-copy">
                  <div className="tag-row">
                    <span className="pill">{article.category}</span>
                    <span className="pill">{article.date}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="home-section-head">
            <div>
              <p className="section-eyebrow">Story Feed</p>
              <h2 className="home-title">Cuộn xuống để xem thêm bài viết</h2>
            </div>
          </div>

          <div className="news-feed-list">
            {visibleStories.map((article, index) => (
              <Link key={article.slug} href={`/tin-tuc/${article.slug}`} className="news-feed-item">
                <div className="news-feed-item-media">
                  <img src={article.image} alt={article.title} />
                </div>
                <div className="news-feed-item-copy">
                  <div className="news-feed-item-meta">
                    <span className="news-feed-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="tag-row">
                      <span className="pill">{article.category}</span>
                      <span className="pill">{article.date}</span>
                    </div>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <span className="news-feed-read-button">Xem bài viết</span>
                </div>
              </Link>
            ))}
          </div>

          {hasMoreStories ? <div ref={loadMoreRef} className="news-feed-autoload">Đang tải thêm bài viết...</div> : null}
          {hasMoreStories ? (
            <div className="section-more news-feed-more">
              <button
                type="button"
                className="more-link-unified news-feed-more-button"
                onClick={() => setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, storyFeed.length))}
              >
                Xem thêm bài viết cũ hơn
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
