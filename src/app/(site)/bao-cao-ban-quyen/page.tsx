import { Scale, ShieldCheck } from 'lucide-react'
import { PageHero } from '@/components/page-hero'

type CopyrightReportPageProps = {
  searchParams: Promise<{
    track?: string
    artist?: string
    trackId?: string
    source?: string
  }>
}

export default async function CopyrightReportPage({ searchParams }: CopyrightReportPageProps) {
  const params = await searchParams
  const track = params.track ?? ''
  const artist = params.artist ?? ''
  const trackId = params.trackId ?? ''
  const source = params.source ?? ''

  return (
    <main>
      <PageHero
        eyebrow="Báo cáo bản quyền"
        title="Tiếp nhận yêu cầu bản quyền một cách thiện chí"
        intro="Nếu bạn là chủ thể quyền hoặc đại diện hợp pháp và cần phản ánh nội dung âm nhạc, xin vui lòng cung cấp thông tin rõ ràng tại đây. Chúng tôi ưu tiên một quy trình tiếp nhận cẩn trọng, tôn trọng và hướng đến đối thoại minh bạch giữa các bên."
      />

      <section className="section">
        <div className="container contact-page-grid">
          <div className="contact-page-main">
            <form className="form-shell contact-form-shell">
              <div className="contact-form-head">
                <div>
                  <p className="section-eyebrow">Copyright Intake</p>
                  <h2>Gửi báo cáo bản quyền</h2>
                </div>
                <p className="muted">
                  Form này dành riêng cho các vấn đề quyền sở hữu, cấp phép và yêu cầu rà soát nội dung âm nhạc.
                </p>
              </div>

              <div className="contact-form-grid">
                <div className="field">
                  <label htmlFor="copyrightName">Họ và tên</label>
                  <input id="copyrightName" name="copyrightName" placeholder="Nguyễn Văn A" />
                </div>

                <div className="field">
                  <label htmlFor="copyrightEmail">Email liên hệ</label>
                  <input id="copyrightEmail" name="copyrightEmail" type="email" placeholder="name@example.com" />
                </div>

                <div className="field">
                  <label htmlFor="copyrightRole">Vai trò của bạn</label>
                  <input id="copyrightRole" name="copyrightRole" placeholder="Chủ thể quyền, luật sư, đại diện phát hành..." />
                </div>

                <div className="field">
                  <label htmlFor="copyrightOrganization">Đơn vị / tổ chức</label>
                  <input id="copyrightOrganization" name="copyrightOrganization" placeholder="Label, agency, công ty luật..." />
                </div>

                <div className="field">
                  <label htmlFor="reportedTrack">Track bị báo cáo</label>
                  <input id="reportedTrack" name="reportedTrack" defaultValue={track} placeholder="Tên track" />
                </div>

                <div className="field">
                  <label htmlFor="reportedArtist">Nghệ sĩ / người đăng</label>
                  <input id="reportedArtist" name="reportedArtist" defaultValue={artist} placeholder="Tên nghệ sĩ" />
                </div>

                <div className="field">
                  <label htmlFor="reportedTrackId">Mã track</label>
                  <input id="reportedTrackId" name="reportedTrackId" defaultValue={trackId} placeholder="track-id" />
                </div>

                <div className="field">
                  <label htmlFor="reportedSource">Nguồn hiển thị</label>
                  <input id="reportedSource" name="reportedSource" defaultValue={source} placeholder="nonstop / remix / track" />
                </div>

                <div className="field">
                  <label htmlFor="ownershipProof">Link hoặc tài liệu chứng minh quyền sở hữu</label>
                  <input id="ownershipProof" name="ownershipProof" placeholder="Link release gốc, metadata, hợp đồng, tài liệu pháp lý..." />
                </div>

                <div className="field">
                  <label htmlFor="requestedAction">Đề xuất hướng xử lý</label>
                  <input id="requestedAction" name="requestedAction" placeholder="Gỡ tạm, xác minh, cập nhật credit, liên hệ trước khi xử lý..." />
                </div>
              </div>

              <div className="field">
                <label htmlFor="copyrightDetails">Nội dung chi tiết</label>
                <textarea
                  id="copyrightDetails"
                  name="copyrightDetails"
                  placeholder="Vui lòng mô tả rõ nội dung quyền sở hữu, phạm vi tranh chấp, chủ thể quyền liên quan và thông tin cần đội vận hành ưu tiên xác minh."
                />
              </div>

              <div className="contact-form-note">
                <strong>Nguyên tắc tiếp nhận</strong>
                <p>
                  9LIFE MAG ưu tiên rà soát kỹ lưỡng, giữ thái độ cầu thị và bảo mật thông tin cần thiết trong suốt quá trình xử lý phản ánh bản quyền.
                </p>
              </div>

              <div className="artist-profile-cta-row">
                <button type="button" className="button">Gửi báo cáo bản quyền</button>
                <a href="mailto:copyright@9lifemag.com" className="button-secondary">
                  copyright@9lifemag.com
                </a>
              </div>
            </form>
          </div>

          <aside className="contact-page-side">
            <article className="contact-side-card">
              <div className="contact-side-icon">
                <Scale size={18} />
              </div>
              <h3>Rà soát cẩn trọng</h3>
              <p>
                Với các phản ánh bản quyền, team sẽ ưu tiên kiểm tra link gốc, metadata, chủ thể quyền và phạm vi sử dụng nội dung trước khi đưa ra bước tiếp theo.
              </p>
            </article>

            <article className="contact-side-card contact-side-card-soft">
              <div className="contact-side-icon">
                <ShieldCheck size={18} />
              </div>
              <h3>Ưu tiên đối thoại thiện chí</h3>
              <p>
                Mục tiêu của form này là mở ra một đầu mối trao đổi rõ ràng, mềm mỏng và minh bạch để giảm hiểu nhầm, tăng cơ hội xử lý hợp tác.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  )
}
