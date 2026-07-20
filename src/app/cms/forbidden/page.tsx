import Link from 'next/link'

export default function CmsForbiddenPage() {
  return (
    <main className="account-page">
      <section className="account-hero">
        <div className="container">
          <p className="section-eyebrow">CMS Access</p>
          <h1>Workspace này chưa được cấp quyền</h1>
          <p className="section-intro">Tài khoản hiện tại không có quyền truy cập khu vực quản trị này. Vui lòng liên hệ quản trị viên nếu bạn cần bổ sung phạm vi công việc.</p>
          <Link href="/cms" className="button">Quay lại CMS</Link>
        </div>
      </section>
    </main>
  )
}
