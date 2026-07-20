import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsTelegramBookingConfig, getCmsArtistBySlug } from '@/lib/cms-dashboard-data'
import { getArtistPrivateContact } from '@/lib/artist-private-contact'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'
import { hasCmsScope } from '@/lib/cms-role-policy'

export default async function CmsArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const artist = getCmsArtistBySlug(slug)

  if (!artist) notFound()
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
                <input id="artistCity" defaultValue={artist.city} />
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
