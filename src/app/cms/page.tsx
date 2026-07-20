import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CmsAccessTabs } from '@/components/cms-access-tabs'
import { CmsTopbar } from '@/components/cms-topbar'
import { CMS_SESSION_COOKIE, verifyCmsSessionToken } from '@/lib/cms-session'

const highlights = ['CMS là khu vận hành riêng, tách biệt khỏi tài khoản cộng đồng.', 'Yêu cầu tạo tài khoản luôn cần Admin xét duyệt trước khi được cấp quyền.', 'Việc truy cập, phân quyền và thao tác quản trị đều được kiểm soát tại server.']

export default async function CmsLoginPage() {
  const cookieStore = await cookies()
  const session = await verifyCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)
  if (session) redirect('/cms/dashboard')
  return <div className="cms-shell"><CmsTopbar /><main className="cms-page"><section className="section"><div className="container cms-login-grid">
    <div className="cms-login-intro"><p className="kicker">Backend Access</p><h1 className="page-title">Cổng quản trị 9LIFE CMS</h1><p className="page-intro">Không gian vận hành nội bộ dành cho editorial, artist ops, music ops, finance và quản trị hệ thống.</p><div className="cms-bullet-list">{highlights.map((item) => <div key={item} className="cms-bullet-item"><span className="account-benefit-dot" /><p>{item}</p></div>)}</div><div className="cms-login-actions"><Link href="/" className="button-secondary">Quay lại trang chủ</Link></div></div>
    <div className="cms-login-card"><div className="cms-login-card-head"><p className="section-eyebrow">Secure Entry</p><h2>Đăng nhập hoặc gửi yêu cầu cấp quyền</h2><p className="muted">Tài khoản mới phải được duyệt tại Phân quyền Admin trước khi nhận quyền truy cập CMS.</p></div><CmsAccessTabs /><div className="cms-security-panel"><h3>Nguyên tắc bảo mật</h3><p className="cms-security-note">Bảo mật được thực thi bằng xác thực, phân quyền, session HttpOnly, audit log và secret đặt ở server; không dựa vào việc ẩn mã nguồn trình duyệt.</p></div></div>
  </div></section></main></div>
}
