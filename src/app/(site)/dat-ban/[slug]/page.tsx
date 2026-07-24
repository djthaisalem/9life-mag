import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Clock3, GlassWater, MapPin, Music4, Sparkles, Star, Users2 } from 'lucide-react'
import { OutletProfileActions } from '@/components/outlet-profile-actions'
import { ContentDiscovery } from '@/components/content-discovery'
import { clubOutlets, getOutletBySlug, getOutletProfile } from '@/lib/club-booking-data'
import { createShareMetadata } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const outlet = getOutletBySlug(slug)
  if (!outlet) return {}
  return createShareMetadata({ title: `${outlet.name} | Nightlife Outlet`, description: outlet.summary, path: `/dat-ban/${outlet.slug}`, image: outlet.cover })
}

export default async function OutletProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const outlet = getOutletBySlug(slug)

  if (!outlet) {
    notFound()
  }

  const profile = getOutletProfile(outlet)
  const relatedOutlets = clubOutlets.filter((item) => item.slug !== outlet.slug).slice(0, 3)

  return (
    <>
    <main className="outlet-profile-page">
      <section className="artist-profile-hero outlet-profile-hero">
        <img src={outlet.cover} alt={outlet.name} className="artist-profile-hero-image" />
        <div className="artist-profile-hero-overlay" />
        <div className="container artist-profile-hero-inner">
          <div className="artist-profile-hero-copy">
            <div className="tag-row">
              <Link className="pill" href={`/dia-diem?location=${encodeURIComponent(outlet.city)}`}>{outlet.city}</Link>
              <span className="pill">{outlet.type}</span>
              <span className="pill">{outlet.vibe}</span>
            </div>
            <h1>{outlet.name}</h1>
            <p className="artist-profile-lead">{outlet.summary}</p>

            <div className="artist-profile-cta-row">
              <Link href="/dat-ban" className="button-secondary">
                Quay lại outlet
              </Link>
            </div>

            <OutletProfileActions
              bookingHref={`/dat-ban/yeu-cau?outlet=${outlet.slug}`}
              outletName={outlet.name}
              outletSlug={outlet.slug}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container artist-profile-grid-main">
          <div className="artist-profile-main">
            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Outlet Overview</p>
                  <h2>Thông tin nổi bật</h2>
                </div>
              </div>

              <div className="artist-overview-grid">
                {profile.stats.map((item, index) => {
                  const icons = [MapPin, Clock3, Users2, Star]
                  const Icon = icons[index] ?? Sparkles
                  return (
                    <article key={item.label}>
                      <Icon size={18} />
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  )
                })}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Venue Story</p>
                  <h2>Giới thiệu outlet</h2>
                </div>
              </div>

              <div className="artist-story-copy">
                {profile.introduction.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Why It Works</p>
                  <h2>Điểm mạnh nightlife</h2>
                </div>
              </div>

              <div className="artist-highlight-list">
                {profile.highlights.map((item) => (
                  <div key={item} className="artist-highlight-item">
                    <Sparkles size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Table Experience</p>
                  <h2>Khu bàn và dịch vụ</h2>
                </div>
              </div>

              <div className="outlet-profile-split">
                <div className="outlet-profile-block">
                  <strong>Loại bàn</strong>
                  <div className="artist-detail-list">
                    {profile.tableOptions.map((item) => (
                      <div key={item} className="artist-detail-item">
                        <GlassWater size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="outlet-profile-block">
                  <strong>Lưu ý dịch vụ</strong>
                  <div className="artist-detail-list">
                    {profile.serviceNotes.map((item) => (
                      <div key={item} className="artist-detail-item">
                        <Users2 size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Music Mood</p>
                  <h2>Âm nhạc và vibe trong đêm</h2>
                </div>
              </div>

              <div className="artist-pill-group">
                {profile.musicStyles.map((item) => (
                  <span key={item} className="artist-info-pill">
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Venue Gallery</p>
                  <h2>Hình ảnh không gian và khu bàn</h2>
                </div>
              </div>

              <div className="artist-gallery-grid">
                {profile.gallery.map((item) => (
                  <figure key={item.image} className="artist-gallery-card">
                    <img src={item.image} alt={item.caption} />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">FAQ</p>
                  <h2>Câu hỏi thường gặp</h2>
                </div>
              </div>

              <div className="artist-faq-list">
                {profile.faq.map((item) => (
                  <article key={item.question} className="artist-faq-card">
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Book This Outlet</p>
                  <h2>Đặt bàn hoặc vote ngay</h2>
                </div>
              </div>

              <OutletProfileActions
                bookingHref={`/dat-ban/yeu-cau?outlet=${outlet.slug}`}
                outletName={outlet.name}
                outletSlug={outlet.slug}
              />
            </article>
          </div>

          <aside className="artist-profile-side">
            <article className="artist-panel">
              <div className="artist-side-portrait">
                <img src={outlet.image} alt={outlet.name} />
              </div>
              <div className="artist-side-details">
                <strong>{outlet.vibe}</strong>
                <span>{outlet.city} / {outlet.regionLabel}</span>
                <span>{outlet.hours}</span>
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Quick Booking</p>
                  <h2>Điểm quyết định nhanh</h2>
                </div>
              </div>

              <div className="artist-value-list">
                <div className="artist-value-card">
                  <MapPin size={18} />
                  <div>
                    <strong>Khu vực</strong>
                    <span>
                      <Link href={`/dia-diem?location=${encodeURIComponent(outlet.city)}`}>{outlet.city}</Link> - {outlet.regionLabel}
                    </span>
                  </div>
                </div>
                <div className="artist-value-card">
                  <Clock3 size={18} />
                  <div>
                    <strong>Giờ hoạt động</strong>
                    <span>{outlet.hours}</span>
                  </div>
                </div>
                <div className="artist-value-card">
                  <Music4 size={18} />
                  <div>
                    <strong>Vibe trong đêm</strong>
                    <span>{outlet.vibe}</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Related Outlet</p>
                  <h2>Khám phá venue khác</h2>
                </div>
              </div>

              <div className="artist-related-list">
                {relatedOutlets.map((item) => (
                  <Link key={item.slug} href={`/dat-ban/${item.slug}`} className="artist-related-card">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.city}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
    <ContentDiscovery current={{ kind: 'outlet', id: outlet.slug }} />
    </>
  )
}
