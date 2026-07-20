import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  CalendarDays,
  Camera,
  BriefcaseBusiness,
  CirclePlay,
  ExternalLink,
  Globe2,
  MapPin,
  Radio,
  Sparkles,
  Users2,
  Video,
  Waves,
} from 'lucide-react'
import { artistProfiles, getArtistBySlug, getArtistRichContent } from '@/lib/artist-directory-data'
import { getArtistAgency, getArtistAgentName } from '@/lib/artist-agency-data'
import { getStoredArtistAgency } from '@/lib/artist-agency-store'
import { ArtistProfileActions } from '@/components/artist-profile-actions'
import { StudentApplicationButton } from '@/components/student-application-button'
import { ArtistGalleryLightbox } from '@/components/artist-gallery-lightbox'
import { getArtistAgentAssignments } from '@/lib/site-user-session'
import { createShareMetadata } from '@/lib/seo'
import { getStudentRegistrationEnabled } from '@/lib/student-registration-settings'

type ArtistProfilePageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ArtistProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtistBySlug(slug)
  if (!artist) return {}
  return createShareMetadata({ title: `${artist.name} | ${artist.role}`, description: artist.bio, path: `/nghe-si/${artist.slug}`, image: artist.cover })
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = await params
  const artist = getArtistBySlug(slug)

  if (!artist) {
    notFound()
  }

  const relatedArtists = artistProfiles.filter((item) => item.slug !== artist.slug).slice(0, 3)
  const richContent = getArtistRichContent(artist)
  const assignments = await getArtistAgentAssignments()
  const assignedAgent = assignments.find((item) => item.artistProfileSlug === artist.slug)?.artistAgent
  const agentName = getArtistAgentName(artist.slug, assignedAgent)
  const baseAgency = getArtistAgency(agentName)
  const agency = baseAgency ? await getStoredArtistAgency(baseAgency.slug) : undefined
  const studentRegistrationEnabled = await getStudentRegistrationEnabled('artist', artist.slug)

  return (
    <main className="artist-profile-page">
      <section className="artist-profile-hero">
        <img src={artist.cover} alt={artist.name} className="artist-profile-hero-image" />
        <div className="artist-profile-hero-overlay" />
        <div className="container artist-profile-hero-inner">
          <div className="artist-profile-hero-copy">
            <div className="tag-row">
              <span className="pill">{artist.role}</span>
              <span className="pill">{artist.location}</span>
              <span className="pill">{artist.followers}</span>
            </div>
            <h1>{artist.name}</h1>
            <p className="artist-profile-lead">{artist.bio}</p>

            <div className="artist-profile-cta-row">
              <ArtistProfileActions
                artistName={artist.name}
                artistSlug={artist.slug}
                bookingHref={`/booking?artist=${artist.slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container artist-profile-grid-main">
          <div className="artist-profile-main">
            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Overview</p>
                  <h2>Thông tin nổi bật</h2>
                </div>
              </div>

              <div className="artist-overview-grid">
                <article>
                  <MapPin size={18} />
                  <strong>{artist.location}</strong>
                  <span>Khu vực hoạt động chính</span>
                </article>
                <article>
                  <CalendarDays size={18} />
                  <strong>{artist.availability}</strong>
                  <span>Tình trạng nhận show</span>
                </article>
                <article>
                  <Radio size={18} />
                  <strong>{artist.rate}</strong>
                  <span>Mức giá tham khảo</span>
                </article>
                <article>
                  <Users2 size={18} />
                  <strong>{artist.socialProof.monthlyReach}</strong>
                  <span>Độ phủ cộng đồng</span>
                </article>
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Professional Background</p>
                  <h2>Kinh nghiệm làm việc</h2>
                </div>
              </div>
              <div className="artist-highlight-list">
                {richContent.workExperience.map((item) => (
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
                  <p className="section-eyebrow">Artist Story</p>
                  <h2>Giới thiệu về nghệ sĩ</h2>
                </div>
              </div>

              <div className="artist-story-copy">
                {richContent.introduction.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Creative Fit</p>
                  <h2>Phong cách và thế mạnh</h2>
                </div>
              </div>

              <div className="artist-highlight-list">
                {richContent.signatureMoments.map((item) => (
                  <div key={item} className="artist-highlight-item">
                    <Sparkles size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="artist-pill-group">
                {artist.performanceModes.map((item) => (
                  <span key={item} className="artist-info-pill">
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Media Showcase</p>
                  <h2>Video nổi bật</h2>
                </div>
              </div>

              <div className="artist-media-grid">
                {richContent.videos.map((videoItem) => (
                  <article key={videoItem.title} className="artist-embed-card">
                    <div className="artist-embed-frame">
                      <iframe
                        src={videoItem.embedUrl}
                        title={videoItem.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="artist-embed-meta">
                      <div>
                        <strong>{videoItem.title}</strong>
                        <span>{videoItem.platform} embed</span>
                      </div>
                      <a href={videoItem.href} target="_blank" rel="noreferrer" className="artist-inline-link">
                        Mở nguồn <ExternalLink size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Listen</p>
                  <h2>Nhạc nổi bật có thể phát ngay</h2>
                </div>
              </div>

              <div className="artist-audio-stack">
                {richContent.audio.map((audioItem) => (
                  <article key={audioItem.title} className="artist-embed-card artist-audio-card">
                    <div className="artist-embed-meta artist-embed-meta-top">
                      <div>
                        <strong>{audioItem.title}</strong>
                        <span>{audioItem.subtitle}</span>
                      </div>
                      <CirclePlay size={18} />
                    </div>
                    <div className="artist-audio-frame">
                      <iframe title={audioItem.title} src={audioItem.embedUrl} allow="autoplay" />
                    </div>
                  </article>
                ))}
              </div>
            </article>

            {richContent.gallery.length >= 4 ? <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Gallery</p>
                  <h2>Hình ảnh và khoảnh khắc sân khấu</h2>
                </div>
              </div>

              <ArtistGalleryLightbox items={richContent.gallery.slice(0, 10)} />
            </article> : null}

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Coverage</p>
                  <h2>Khu vực có thể nhận booking</h2>
                </div>
              </div>

              <div className="artist-city-grid">
                {artist.cities.map((city) => (
                  <div key={city} className="artist-city-card">
                    <strong>{city}</strong>
                    <span>Available for booking</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Booking Essentials</p>
                  <h2>Thông tin hữu ích cho đối tác</h2>
                </div>
              </div>

              <div className="artist-detail-dual">
                <div className="artist-detail-block">
                  <strong>Ghi chú booking</strong>
                  <div className="artist-detail-list">
                    {richContent.bookingNotes.map((item) => (
                      <div key={item} className="artist-detail-item">
                        <Sparkles size={16} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="artist-detail-block">
                  <strong>Rider cơ bản</strong>
                  <div className="artist-detail-list">
                    {richContent.rider.map((item) => (
                      <div key={item} className="artist-detail-item">
                        <Waves size={16} />
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
                  <p className="section-eyebrow">FAQ</p>
                  <h2>Câu hỏi thường gặp</h2>
                </div>
              </div>

              <div className="artist-faq-list">
                {richContent.faq.map((item) => (
                  <article key={item.question} className="artist-faq-card">
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="artist-panel artist-panel-cta">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Action</p>
                  <h2>Đặt booking hoặc vote ngay</h2>
                </div>
              </div>

              <ArtistProfileActions
                artistName={artist.name}
                artistSlug={artist.slug}
                bookingHref={`/booking?artist=${artist.slug}`}
              />
            </article>
          </div>

          <aside className="artist-profile-side">
            <article className="artist-panel artist-agent-card">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Agent Manager</p>
                  <h2>Đơn vị quản lý</h2>
                </div>
                <BriefcaseBusiness size={20} />
              </div>
              {agency ? <Link href={`/agent/${agency.slug}`} className="artist-agent-card-link"><img src={agency.image} alt={agency.name} /><div><strong>{agency.name}</strong><span>{agency.label} · {agency.location}</span><small>Xem profile Agent và roster nghệ sĩ</small></div></Link> : <div className="artist-agent-independent"><strong>Nghệ sĩ tự do</strong><span>Hồ sơ hiện chưa thuộc quyền quản lý của Agent.</span></div>}
            </article>

            <article className="artist-panel">
              <div className="artist-side-portrait">
                <img src={artist.image} alt={artist.name} />
              </div>
              <div className="artist-side-details">
                <strong>{artist.genres}</strong>
                <span>{artist.socialProof.eventsDone}</span>
                <span>{artist.socialProof.brandTone}</span>
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Quick Links</p>
                  <h2>Kênh media</h2>
                </div>
              </div>

              <div className="artist-quick-grid">
                {richContent.socials.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="artist-quick-link">
                    <Globe2 size={16} />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </article>

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Profile Value</p>
                  <h2>Điểm mạnh nhanh</h2>
                </div>
              </div>

              <div className="artist-value-list">
                <div className="artist-value-card">
                  <Video size={18} />
                  <div>
                    <strong>Media sẵn</strong>
                    <span>Video, audio, gallery để chốt booking nhanh hơn</span>
                  </div>
                </div>
                <div className="artist-value-card">
                  <Camera size={18} />
                  <div>
                    <strong>Hình ảnh rõ định vị</strong>
                    <span>Dễ đưa vào proposal, line-up page hoặc bài PR</span>
                  </div>
                </div>
                <div className="artist-value-card">
                  <Waves size={18} />
                  <div>
                    <strong>Có thể mở rộng từ CMS</strong>
                    <span>Sau này thêm playlist, video, lịch diễn và file rider thật</span>
                  </div>
                </div>
              </div>
            </article>

            {studentRegistrationEnabled ? <article className="artist-panel student-application-profile-card">
              <div className="artist-panel-head"><div><p className="section-eyebrow">Mentorship</p><h2>Đăng ký học viên</h2></div></div>
              <p>Gửi thông tin học tập trực tiếp đến {artist.name}. Nghệ sĩ sẽ chủ động xem xét và liên hệ lại nếu phù hợp.</p>
              <StudentApplicationButton targetType="artist" targetSlug={artist.slug} targetName={artist.name} />
            </article> : null}

            <article className="artist-panel">
              <div className="artist-panel-head">
                <div>
                  <p className="section-eyebrow">Related</p>
                  <h2>Gợi ý talent khác</h2>
                </div>
              </div>

              <div className="artist-related-list">
                {relatedArtists.map((item) => (
                  <Link key={item.slug} href={`/nghe-si/${item.slug}`} className="artist-related-card">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.role}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  )
}
