'use client'

import { FileText, Handshake, Megaphone, Scale, ShieldCheck } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { PageHero } from '@/components/page-hero'

const contactTopics = [
  {
    title: 'Liên hệ quảng cáo',
    description: 'Dành cho brand, venue, đối tác truyền thông hoặc chiến dịch cần truyền tải rõ brief, ngân sách và mốc thời gian.'
  },
  {
    title: 'Liên hệ bản quyền',
    description: 'Dành cho phản ánh nội dung, xác minh quyền sở hữu, yêu cầu rà soát hoặc mong muốn trao đổi theo hướng tôn trọng và thiện chí.'
  },
  {
    title: 'Hợp tác agent / artist management',
    description: 'Dành cho nghệ sĩ, quản lý, agency hoặc đối tác muốn kết nối dài hạn về booking, quản trị hình ảnh và vận hành thương mại.'
  },
  {
    title: 'Các vấn đề khác',
    description: 'Dành cho những nhu cầu chưa nằm trong nhóm trên như góp ý dịch vụ, đề xuất nội dung hoặc hỗ trợ chung.'
  }
]

const communicationNotes = [
  {
    icon: ShieldCheck,
    title: 'Tiếp nhận với thiện chí',
    body: 'Mọi trao đổi đều được tiếp nhận với tinh thần tôn trọng, lắng nghe và ưu tiên tìm tiếng nói chung trước khi đi vào xử lý chi tiết.'
  },
  {
    icon: Scale,
    title: 'Rõ ràng và công bằng',
    body: 'Với các vấn đề nhạy cảm như bản quyền hoặc hợp tác độc quyền, team sẽ rà soát thông tin cẩn trọng và phản hồi theo hướng minh bạch.'
  },
  {
    icon: Handshake,
    title: 'Ưu tiên đối thoại',
    body: 'Chúng tôi tin rằng một cuộc trao đổi đúng ngữ cảnh, đúng đầu mối sẽ giúp rút ngắn hiểu nhầm và mở ra cơ hội hợp tác tốt hơn.'
  }
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')

    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/contact-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: formData.get('contactTopic'),
        fullName: formData.get('fullName'),
        organization: formData.get('organization'),
        role: formData.get('role'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        referenceLink: formData.get('referenceLink'),
        timeline: formData.get('timeline'),
        message: formData.get('message'),
        goodwill: formData.get('goodwill'),
      }),
    })
    const result = await response.json() as { ok: boolean; message?: string }
    setFeedback(result.message ?? 'Chưa thể gửi liên hệ lúc này. Vui lòng thử lại sau.')
    setIsSubmitting(false)
    if (result.ok) event.currentTarget.reset()
  }

  return (
    <main>
      <PageHero
        eyebrow="Liên hệ"
        title="Kết nối cùng 9LIFE MAG"
        intro="Nếu bạn cần trao đổi về quảng cáo, bản quyền, hợp tác agent hoặc bất kỳ vấn đề nào khác, xin hãy để lại thông tin tại đây. Chúng tôi mong muốn mọi cuộc liên hệ đều bắt đầu bằng sự tôn trọng, thiện chí và tinh thần cùng tìm giải pháp phù hợp."
      />

      <section className="section">
        <div className="container contact-page-grid">
          <div className="contact-page-main">
            <div className="contact-intent-grid">
              {contactTopics.map((topic, index) => {
                const icons = [Megaphone, FileText, Handshake, ShieldCheck]
                const Icon = icons[index] ?? FileText
                return (
                  <article key={topic.title} className="contact-intent-card">
                    <span className="contact-intent-icon">
                      <Icon size={18} />
                    </span>
                    <strong>{topic.title}</strong>
                    <p>{topic.description}</p>
                  </article>
                )
              })}
            </div>

            <form className="form-shell contact-form-shell" onSubmit={handleSubmit}>
              <div className="contact-form-head">
                <div>
                  <p className="section-eyebrow">Contact Form</p>
                  <h2>Gửi nội dung liên hệ</h2>
                </div>
                <p className="muted">
                  Vui lòng chọn đúng nhóm nội dung để thư của bạn được chuyển đến đầu mối phù hợp ngay từ đầu.
                </p>
              </div>

              <div className="contact-form-grid">
                <div className="field">
                  <label htmlFor="contactTopic">Nội dung liên hệ</label>
                  <select id="contactTopic" name="contactTopic" defaultValue="Liên hệ quảng cáo">
                    <option>Liên hệ quảng cáo</option>
                    <option>Liên hệ bản quyền</option>
                    <option>Liên hệ các nội dung hợp tác cấp agent / artist management</option>
                    <option>Các vấn đề khác</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="fullName">Họ và tên</label>
                  <input id="fullName" name="fullName" placeholder="Nguyễn Văn A" required />
                </div>

                <div className="field">
                  <label htmlFor="organization">Đơn vị / thương hiệu / nghệ danh</label>
                  <input id="organization" name="organization" placeholder="Tên công ty, agency, nghệ sĩ hoặc outlet" />
                </div>

                <div className="field">
                  <label htmlFor="role">Vai trò của bạn</label>
                  <input id="role" name="role" placeholder="Brand manager, copyright representative, artist manager..." />
                </div>

                <div className="field">
                  <label htmlFor="email">Email liên hệ</label>
                  <input id="email" name="email" type="email" placeholder="name@example.com" required />
                </div>

                <div className="field">
                  <label htmlFor="phone">Số điện thoại / Zalo</label>
                  <input id="phone" name="phone" placeholder="090x xxx xxx" />
                </div>

                <div className="field">
                  <label htmlFor="referenceLink">Link tham chiếu</label>
                  <input
                    id="referenceLink"
                    name="referenceLink"
                    placeholder="Link bài viết, tài liệu, hồ sơ nghệ sĩ, campaign hoặc tài sản cần trao đổi"
                  />
                </div>

                <div className="field">
                  <label htmlFor="timeline">Mức độ ưu tiên / thời hạn mong muốn</label>
                  <input id="timeline" name="timeline" placeholder="Ví dụ: cần phản hồi trong 24h hoặc trước ngày 20/07/2026" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="message">Nội dung chi tiết</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Xin vui lòng chia sẻ bối cảnh, nhu cầu cụ thể, phạm vi mong muốn làm việc hoặc vấn đề đang cần cùng trao đổi. Với các trường hợp liên quan bản quyền, bạn có thể ghi rõ chủ thể quyền, tài sản liên quan và hướng đề xuất xử lý để chúng tôi tiếp nhận cẩn trọng hơn."
                  required
                  minLength={20}
                />
              </div>

              <div className="field">
                <label htmlFor="goodwill">Ghi chú thêm để việc trao đổi thuận lợi hơn</label>
                <textarea
                  id="goodwill"
                  name="goodwill"
                  placeholder="Ví dụ: khung giờ dễ liên hệ, đầu mối đồng hành, mong muốn trao đổi kín đáo, mong muốn ưu tiên gặp trực tiếp hoặc online..."
                />
              </div>

              <div className="contact-form-note">
                <strong>Cam kết tiếp nhận</strong>
                <p>
                  Chúng tôi trân trọng mọi liên hệ được gửi đến và luôn ưu tiên một cách tiếp cận bình tĩnh, thiện chí, bảo mật thông tin cần thiết
                  và tôn trọng lợi ích chính đáng của các bên liên quan.
                </p>
              </div>

              <div className="artist-profile-cta-row">
                <button type="submit" className="button" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi...' : 'Gửi liên hệ'}</button>
                <a href="mailto:hello@9lifemag.com" className="button-secondary">
                  hello@9lifemag.com
                </a>
              </div>
              {feedback ? <p className="contact-form-feedback">{feedback}</p> : null}
            </form>
          </div>

          <aside className="contact-page-side">
            <article className="contact-side-card">
              <p className="section-eyebrow">Communication Tone</p>
              <h3>Một cánh cửa mở bằng sự chân thành</h3>
              <p>
                Dù là cơ hội hợp tác hay vấn đề cần rà soát, chúng tôi mong mỗi cuộc trao đổi đều bắt đầu từ thái độ lắng nghe, mềm mỏng
                và tôn trọng giá trị của nhau.
              </p>
            </article>

            <div className="contact-side-stack">
              {communicationNotes.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="contact-side-card">
                    <div className="contact-side-icon">
                      <Icon size={18} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                )
              })}
            </div>

            <article className="contact-side-card contact-side-card-soft">
              <p className="section-eyebrow">Response Window</p>
              <h3>Khung phản hồi đề xuất</h3>
              <ul className="feature-list">
                <li>Liên hệ hợp tác, quảng cáo: phản hồi định hướng ban đầu trong vòng 1-2 ngày làm việc.</li>
                <li>Liên hệ bản quyền: ưu tiên tiếp nhận cẩn trọng, phản hồi đầu mối xử lý sớm nhất có thể.</li>
                <li>Trường hợp cần đối thoại sâu hơn: team sẽ chủ động hẹn lịch trao đổi riêng.</li>
              </ul>
            </article>
          </aside>
        </div>
      </section>
    </main>
  )
}
