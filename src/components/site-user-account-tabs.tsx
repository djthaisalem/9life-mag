'use client'

import { useState } from 'react'
import { SiteUserLoginForm } from '@/components/site-user-login-form'
import { SiteUserRegisterForm } from '@/components/site-user-register-form'

export function SiteUserAccountTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  return <>
    <div className="account-auth-tabs" role="tablist" aria-label="Tài khoản user">
      <button type="button" role="tab" aria-selected={activeTab === 'login'} className={activeTab === 'login' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('login')}>Đăng nhập</button>
      <button type="button" role="tab" aria-selected={activeTab === 'register'} className={activeTab === 'register' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('register')}>Tạo tài khoản</button>
    </div>
    {activeTab === 'login' ? <div className="account-auth-panel"><p className="muted">Đăng nhập để theo dõi playlist, lịch sử hoạt động, sao và các yêu cầu đã gửi.</p><SiteUserLoginForm /></div> : <div className="account-auth-panel"><p className="muted">Tài khoản mới nhận 100 sao khởi tạo để bắt đầu vote, nghe nhạc và tham gia cộng đồng.</p><SiteUserRegisterForm /></div>}
  </>
}
