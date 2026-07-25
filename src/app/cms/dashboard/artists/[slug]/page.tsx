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
    return <CmsDashboardShell activeKey="artists" title={`Hồ sơ: ${stageName}`} description="Bản xem duyệt hiển thị theo bố cục profile public; các mục thiếu vẫn được giữ lại để Admin nhắc nghệ sĩ bổ sung.">
      <section className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Bản xem duyệt hồ sơ</p><h2>{stageName}</h2><p className="cms-muted">{String(realArtist.slug ?? '')}</p></div><Link href="/cms/dashboard/artists?status=pending_review" className="button-secondary">Quay lại danh sách</Link></div>
          <div className="artist-profile-draft-hero"><div className="artist-profile-draft-avatar"><span>{stageName.slice(0, 1)}</span></div><div><strong>{headline}</strong><p>{biography}</p><span className="cms-status-chip">{artistStatusLabel[status] ?? 'Bản nháp'}</span></div></div>
          <div className="artist-dashboard-module-grid"><article className="artist-dashboard-module-card"><strong>Vai trò và phong cách</strong><p>{String(realArtist.role ?? 'Chưa chọn vai trò')}</p><p>{genreText}</p></article><article className="artist-dashboard-module-card"><strong>Booking</strong><p>{String(realArtist.bookingPriceLabel ?? 'Chưa cập nhật mức giá booking')}</p><p>{String(realArtist.serviceArea ?? 'Chưa cập nhật khu vực hoạt động')}</p></article><article className="artist-dashboard-module-card"><strong>Giới thiệu đầy đủ</strong><p>{biography}</p></article><article className="artist-dashboard-module-card"><strong>Media và kinh nghiệm</strong><p>Chưa có dữ liệu media / video được gửi kèm hồ sơ.</p></article></div>
        </article>
        <article className="panel"><p className="section-eyebrow">Review action</p><h2>Duyệt sau khi kiểm tra</h2><p className="cms-muted">Chỉ public khi thông tin trên đã đúng. Có thể hủy để nghệ sĩ cập nhật lại.</p>{missingFields.length ? <div className="cms-security-panel"><strong>Các mục nghệ sĩ còn thiếu</strong><ul>{missingFields.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="cms-security-panel"><strong>Hồ sơ cơ bản đã đủ để duyệt</strong><p>Admin vẫn nên đọc lại headline, bio và giá booking trước khi public.</p></div>}<CmsArtistReviewActions artistId={String(realArtist.id)} initialStatus={status} /></article>
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
