import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsTelegramBookingConfig, getCmsArtistBySlug } from '@/lib/cms-dashboard-data'
import { getArtistPrivateContact } from '@/lib/artist-private-contact'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'
import { hasCmsScope } from '@/lib/cms-role-policy'
import { vietnamLocationNames } from '@/lib/vietnam-locations'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { CmsArtistReviewActions } from '@/components/cms-artist-review-actions'
import { getArtistProfileDraft } from '@/lib/artist-profile-draft-store'
import { getMediaEmbed } from '@/lib/media-embed'

const artistStatusLabel: Record<string, string> = {
  draft: 'Bản nháp',
  pending_review: 'Chờ duyệt',
  published: 'Đã duyệt và công khai',
  archived: 'Đã hủy',
}

export default async function CmsArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const artist = getCmsArtistBySlug(slug)

  if (!artist) {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'artists', where: { slug: { equals: slug } }, limit: 1, depth: 0, pagination: false, overrideAccess: true })
    const realArtist = result.docs[0] as Record<string, unknown> | undefined
    if (!realArtist) notFound()

    const status = typeof realArtist.profileStatus === 'string' ? realArtist.profileStatus : 'draft'
    const missingFields = [
      !realArtist.seoTitle && 'Câu giới thiệu nổi bật',
      !realArtist.seoDescription && 'Giới thiệu ngắn',
      !realArtist.role && 'Vai trò chính',
      !realArtist.bookingPriceLabel && 'Mức giá hoặc ghi chú booking',
      !realArtist.serviceArea && 'Khu vực hoạt động',
      !Array.isArray(realArtist.genres) || realArtist.genres.length === 0 ? 'Phong cách / dòng nhạc' : false,
    ].filter(Boolean) as string[]
    const stageName = String(realArtist.stageName ?? 'Nghệ sĩ')
    const headline = String(realArtist.seoTitle ?? 'Nghệ sĩ chưa bổ sung câu giới thiệu nổi bật.')
    const biography = String(realArtist.seoDescription ?? 'Nghệ sĩ chưa bổ sung giới thiệu ngắn.')
    const genreText = Array.isArray(realArtist.genres) && realArtist.genres.length ? realArtist.genres.map((item) => typeof item === 'object' && item ? String((item as Record<string, unknown>).value ?? '') : String(item)).filter(Boolean).join(', ') : 'Chưa cập nhật'
    const draft = await getArtistProfileDraft(String(realArtist.slug ?? ''))
    const lookup = (name: string) => Object.values(draft).map((item) => item.values?.[name] ?? item.files?.[name] ?? '').find(Boolean) ?? ''
    const portrait = lookup('portraitUpload')
    const cover = lookup('coverUpload')
    const musicUrl = lookup('sourceUrl')
    const videoUrl = lookup('videoUrl')
    const musicEmbed = getMediaEmbed(musicUrl)
    const videoEmbed = getMediaEmbed(videoUrl)
    return <CmsDashboardShell activeKey="artists" title={`Hồ sơ: ${stageName}`} description="Bản xem duyệt hiển thị theo bố cục profile public; các mục thiếu vẫn được giữ lại để Admin nhắc nghệ sĩ bổ sung.">
      <section className="cms-split-grid cms-artist-review-layout">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Bản xem duyệt hồ sơ</p><h2>{stageName}</h2><p className="cms-muted">{String(realArtist.slug ?? '')}</p></div><Link href="/cms/dashboard/artists?status=pending_review" className="button-secondary">Quay lại danh sách</Link></div>
          <section className="artist-profile-page artist-profile-draft-preview cms-artist-review-preview">
            <section className="artist-profile-hero artist-profile-draft-hero-public">
              {cover ? <img className="artist-profile-hero-image" src={cover} alt={`Cover ${stageName}`} /> : null}
              <div className="artist-profile-hero-overlay" />
              <div className="artist-profile-hero-inner">
                <div className="artist-profile-hero-copy"><div className="tag-row"><span className="pill">{lookup('primaryRole') || String(realArtist.role ?? 'Chưa chọn vai trò')}</span><span className="pill">{lookup('city') || String(realArtist.serviceArea ?? 'Chưa có tỉnh thành')}</span></div><h1>{stageName}</h1><p className="artist-profile-lead">{biography}</p><span className="cms-status-chip">{artistStatusLabel[status] ?? 'Bản nháp'}</span></div>
                <div className="artist-profile-draft-avatar">{portrait ? <img src={portrait} alt={`Ảnh ${stageName}`} /> : <span>{stageName.slice(0, 1)}</span>}</div>
              </div>
            </section>
            <div className="artist-profile-grid-main">
              <div className="artist-profile-main">
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Overview</p><h2>Thông tin nổi bật</h2></div></div><div className="artist-overview-grid"><article><strong>{lookup('city') || 'Chưa cập nhật'}</strong><span>Khu vực hoạt động chính</span></article><article><strong>{lookup('availability') || 'Chưa cập nhật'}</strong><span>Tình trạng nhận show</span></article><article><strong>{lookup('bookingRate') || 'Chưa cập nhật'}</strong><span>Mức giá tham khảo</span></article></div></article>
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Professional Background</p><h2>Kinh nghiệm làm việc</h2></div></div><p>{lookup('workExperience') || 'Chưa thêm kinh nghiệm làm việc.'}</p></article>
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Artist Story</p><h2>Giới thiệu về nghệ sĩ</h2></div></div><p>{lookup('longBio') || 'Chưa có giới thiệu chi tiết.'}</p></article>
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Listen</p><h2>Nhạc nổi bật có thể phát ngay</h2></div></div><strong>{lookup('trackTitle') || lookup('playlistName') || 'Chưa có track hoặc mixset'}</strong>{musicEmbed ? <div className="artist-media-embed-preview"><iframe src={musicEmbed.src} title={musicEmbed.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div> : musicUrl ? <a href={musicUrl} target="_blank" rel="noreferrer">Mở link music đã nhập</a> : <p>Chưa thêm link phát nhạc.</p>}</article>
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Media Showcase</p><h2>Video nổi bật</h2></div></div><strong>{lookup('videoTitle') || 'Chưa có video'}</strong>{videoEmbed ? <div className="artist-media-embed-preview"><iframe src={videoEmbed.src} title={videoEmbed.title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div> : videoUrl ? <a href={videoUrl} target="_blank" rel="noreferrer">Mở link video đã nhập</a> : <p>Chưa thêm link video.</p>}</article>
                <article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Editorial</p><h2>Bài viết và spotlight</h2></div></div><strong>{lookup('articleTitle') || 'Chưa có bài spotlight'}</strong><p>{lookup('articleExcerpt') || lookup('editorialNote') || 'Chưa có nội dung editorial.'}</p></article>
              </div>
              <aside className="artist-profile-side"><article className="artist-panel"><div className="artist-side-portrait">{portrait ? <img src={portrait} alt="" /> : <span>Chưa có ảnh chân dung</span>}</div><div className="artist-side-details"><strong>{lookup('genres') || genreText}</strong></div></article><article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Booking Essentials</p><h2>Thông tin đối tác</h2></div></div><p>{lookup('bookingNotes') || 'Chưa có ghi chú booking.'}</p><p>{lookup('basicRider') || 'Chưa có rider cơ bản.'}</p></article></aside>
            </div>
          </section>
        </article>
        <article className="panel cms-artist-review-action-panel"><p className="section-eyebrow">Duyệt hồ sơ</p><h2>Quyết định</h2><p className="cms-muted">Chỉ public sau khi kiểm tra.</p>{missingFields.length ? <div className="cms-security-panel"><strong>Còn thiếu</strong><ul>{missingFields.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="cms-security-panel"><strong>Đủ thông tin cơ bản</strong></div>}<CmsArtistReviewActions artistId={String(realArtist.id)} initialStatus={status} /></article>
      </section>
    </CmsDashboardShell>
  }

  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)
  const canViewPrivateContact = Boolean(session && hasCmsScope(session.role, 'private_contacts'))
  const contact = canViewPrivateContact ? await getArtistPrivateContact(slug) : null

  return (
    <CmsDashboardShell
      activeKey="artists"
      title={`Nghệ sĩ: ${artist.name}`}
      description="Trang hồ sơ nghệ sĩ để xem và chỉnh sửa rõ ràng theo từng trường, đồng thời cấu hình nhận booking và Telegram riêng cho profile này."
    >
      <div className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
            <div>
              <p className="section-eyebrow">Artist Profile</p>
              <h2>Thông tin quản trị</h2>
            </div>
            <div className="cms-inline-actions">
              <Link href="/cms/dashboard/artists" className="button-secondary">
                Quay lại danh sách
              </Link>
              <Link href="/cms/dashboard/booking/artists" className="button-secondary">
                Sang booking artist
              </Link>
            </div>
          </div>

          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="artistName">Tên nghệ sĩ</label>
              <input id="artistName" defaultValue={artist.name} />
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="artistField">Lĩnh vực</label>
                <input id="artistField" defaultValue={artist.field} />
              </div>
              <div className="field">
                <label htmlFor="artistGender">Giới tính</label>
                <input id="artistGender" defaultValue={artist.gender} />
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="artistCity">Khu vực</label>
                <select id="artistCity" defaultValue={artist.city}>
                  <option value="">Chọn tỉnh / thành phố</option>
                  {vietnamLocationNames.map((city) => <option key={city}>{city}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="artistAgent">Agent quản lý</label>
                <input id="artistAgent" defaultValue={artist.agent} />
              </div>
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="artistRate">Booking</label>
                <input id="artistRate" defaultValue={artist.rate} />
              </div>
              <div className="field">
                <label htmlFor="artistVisibility">Hiển thị</label>
                <select id="artistVisibility" defaultValue={artist.visibility}>
                  <option>Đang public</option>
                  <option>Cần rà soát</option>
                  <option>Tạm ẩn</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="artistGenres">Genres / phong cách</label>
              <textarea id="artistGenres" defaultValue={artist.genres} />
            </div>
            <div className="field">
              <label htmlFor="artistAvailability">Trạng thái nhận show</label>
              <textarea id="artistAvailability" defaultValue={artist.availability} />
            </div>
            <div className="field">
              <label htmlFor="artistWorkExperience">Kinh nghiệm làm việc</label>
              <textarea id="artistWorkExperience" placeholder="Mỗi dòng một kinh nghiệm: venue, festival, campaign, tour hoặc vai trò chuyên môn." />
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="section-eyebrow">Booking Config</p>
          <h2>Telegram và cấu hình booking riêng</h2>
          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="artistBookingChannel">Channel Telegram riêng của profile</label>
              <input
                id="artistBookingChannel"
                defaultValue={`@booking_${artist.slug.replaceAll('-', '_')}`}
                placeholder="@booking_artist_name"
              />
            </div>
            <div className="field">
              <label htmlFor="artistBookingGlobalChannel">Channel tổng quản lý booking</label>
              <input
                id="artistBookingGlobalChannel"
                defaultValue={cmsTelegramBookingConfig.globalChannel}
                placeholder="@9lifemag_booking_ops"
              />
            </div>
            <div className="field">
              <label htmlFor="artistBookingBotToken">Telegram bot token</label>
              <input
                id="artistBookingBotToken"
                type="password"
                value=""
                placeholder="Được cấu hình tập trung trên server"
                readOnly
              />
            </div>
            <div className="cms-inline-actions">
              <button type="button" className="button">
                Lưu cấu hình booking
              </button>
            </div>
          </form>

          <div className="cms-overview-stats cms-overview-stats-2">
            <article className="metric">
              <strong>{artist.followers}</strong>
              <span>followers đang hiển thị</span>
            </article>
            <article className="metric">
              <strong>{artist.field}</strong>
              <span>lĩnh vực chính</span>
            </article>
          </div>

          {contact ? <div className="cms-security-panel">
            <strong>Kênh liên hệ riêng của nghệ sĩ</strong>
            <p>Chỉ CMS admin, nghệ sĩ và agent quản lý được xem. Không hiển thị trên profile public.</p>
            <div className="cms-form-two">
              <div className="field"><label>Email</label><input defaultValue={contact.email} readOnly /></div>
              <div className="field"><label>SĐT</label><input defaultValue={contact.phone} readOnly /></div>
              <div className="field"><label>Facebook</label><input defaultValue={contact.facebook} readOnly /></div>
              <div className="field"><label>Telegram</label><input defaultValue={contact.telegram} readOnly /></div>
              <div className="field"><label>Zalo</label><input defaultValue={contact.zalo} readOnly /></div>
              <div className="field"><label>TikTok</label><input defaultValue={contact.tiktok} readOnly /></div>
            </div>
          </div> : null}
        </article>
      </div>
    </CmsDashboardShell>
  )
}
