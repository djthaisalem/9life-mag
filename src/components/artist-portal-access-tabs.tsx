'use client'

import Link from 'next/link'
import { useState } from 'react'

type PortalRole = 'artist' | 'manager' | 'booking'

const dashboardByRole: Record<PortalRole, string> = {
  artist: '/tai-khoan/nghe-si/dashboard',
  manager: '/tai-khoan/nghe-si/manager/dashboard',
  booking: '/tai-khoan/nghe-si/booking/dashboard',
}

type PortalResponse = {
  ok: boolean
  message?: string
  portalRole?: PortalRole
  portalAccessStatus?: 'pending' | 'approved' | 'suspended'
}

export function ArtistPortalAccessTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loginRole, setLoginRole] = useState<PortalRole>('artist')
  const [registerRole, setRegisterRole] = useState<PortalRole>('artist')
  const [message, setMessage] = useState('')
  const [showPendingNotice, setShowPendingNotice] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>, mode: 'login' | 'register') {
    event.preventDefault()
    setMessage('')
    setShowPendingNotice(false)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const role = mode === 'login' ? loginRole : registerRole
    const body = mode === 'login'
      ? {
          identity: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
          accountType: 'artist',
        }
      : {
          fullName: String(formData.get('fullName') ?? ''),
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
          accountType: 'artist',
          portalRole: role,
        }

    try {
      const response = await fetch(`/api/auth/session/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = (await response.json()) as PortalResponse

      if (!response.ok || !result.ok) {
        setMessage(result.message ?? 'Không thể xử lý yêu cầu lúc này.')
        return
      }

      if (result.portalAccessStatus !== 'approved' || !result.portalRole) {
        setMessage('Hồ sơ đăng ký đã được tiếp nhận. Quyền truy cập sẽ được mở sau khi quản trị viên hoàn tất kiểm tra và map phạm vi quản lý phù hợp.')
        setShowPendingNotice(true)
        return
      }

      window.location.assign(dashboardByRole[result.portalRole])
    } catch {
      setMessage('Kết nối chưa ổn định. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <>
    <div className="account-auth-tabs" role="tablist" aria-label="Cổng nghệ sĩ">
      <button type="button" role="tab" aria-selected={activeTab === 'login'} className={activeTab === 'login' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('login')}>Đăng nhập</button>
      <button type="button" role="tab" aria-selected={activeTab === 'register'} className={activeTab === 'register' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('register')}>Tạo tài khoản</button>
    </div>
    {activeTab === 'login' ? <form className="form-shell artist-portal-form" onSubmit={(event) => submit(event, 'login')}>
      <div className="field"><label htmlFor="artistEmail">Email công việc</label><input id="artistEmail" name="email" type="email" placeholder="artist@9lifemag.com" required /></div>
      <div className="field"><label htmlFor="artistPassword">Mật khẩu</label><input id="artistPassword" name="password" type="password" placeholder="Nhập mật khẩu" required /></div>
      <div className="field"><label htmlFor="artistRole">Vai trò hiển thị</label><select id="artistRole" value={loginRole} onChange={(event) => setLoginRole(event.target.value as PortalRole)}><option value="artist">Nghệ sĩ</option><option value="manager">Manager</option><option value="booking">Booking Coordinator</option></select></div>
      {message ? <p className="form-feedback">{message}</p> : null}
      <div className="artist-portal-login-actions"><button type="submit" className="button" disabled={isSubmitting}>{isSubmitting ? 'Đang xác thực...' : 'Vào dashboard'}</button><Link href="/tai-khoan/quen-mat-khau?type=artist" className="button-secondary">Quên mật khẩu</Link></div>
    </form> : <form className="form-shell artist-portal-form" onSubmit={(event) => submit(event, 'register')}>
      <div className="field"><label htmlFor="artistName">Tên nghệ sĩ / đại diện</label><input id="artistName" name="fullName" placeholder="Tên hiển thị trên profile" required /></div>
      <div className="field"><label htmlFor="artistRegisterEmail">Email công việc</label><input id="artistRegisterEmail" name="email" type="email" placeholder="artist@domain.com" required /></div>
      <div className="field"><label htmlFor="artistRegisterPassword">Mật khẩu</label><input id="artistRegisterPassword" name="password" type="password" placeholder="Tối thiểu 8 ký tự" minLength={8} required /></div>
      <div className="field"><label htmlFor="artistRegisterRole">Vai trò</label><select id="artistRegisterRole" value={registerRole} onChange={(event) => setRegisterRole(event.target.value as PortalRole)}><option value="artist">Nghệ sĩ</option><option value="manager">Manager</option><option value="booking">Booking Coordinator</option></select></div>
      <p className="muted">Tài khoản Manager và Booking Coordinator cần được quản trị viên duyệt quyền trước khi dùng dữ liệu vận hành. Hồ sơ nghệ sĩ được lưu nháp trước khi public.</p>
      {message ? <p className="form-feedback">{message}</p> : null}
      {showPendingNotice ? <aside className="cms-security-panel artist-portal-pending-notice"><strong>Thông tin hỗ trợ xét duyệt</strong><p>Đội ngũ 9LIFE sẽ rà soát vai trò và phạm vi quản lý trước khi cấp dashboard. Vui lòng không tạo thêm tài khoản trùng lặp trong thời gian chờ phản hồi.</p><ul><li>Email: <a href="mailto:9lifemag@gmail.com">9lifemag@gmail.com</a></li><li>Telegram: <a href="https://t.me/ninelifemagadmin" target="_blank" rel="noreferrer">t.me/ninelifemagadmin</a></li><li>Zalo: <a href="tel:0938815158">0938815158</a></li><li>Facebook: <a href="https://fb.com/9lifemag" target="_blank" rel="noreferrer">fb.com/9lifemag</a></li></ul></aside> : null}
      <div className="artist-portal-login-actions"><button type="submit" className="button" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}</button><Link href="/tai-khoan" className="button-secondary">Quay lại tài khoản</Link></div>
    </form>}
  </>
}
