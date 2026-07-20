'use client'

import { useState } from 'react'
import { CmsAccessRequestForm } from '@/components/cms-access-request-form'
import { CmsLoginForm } from '@/components/cms-login-form'

export function CmsAccessTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  return <><div className="account-auth-tabs" role="tablist" aria-label="CMS access"><button type="button" role="tab" aria-selected={activeTab === 'login'} className={activeTab === 'login' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('login')}>Đăng nhập</button><button type="button" role="tab" aria-selected={activeTab === 'register'} className={activeTab === 'register' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'} onClick={() => setActiveTab('register')}>Tạo tài khoản</button></div>
    <div className="account-auth-panel">{activeTab === 'login' ? <CmsLoginForm /> : <><p className="muted">Yêu cầu sẽ được chuyển đến Phân quyền Admin. Chỉ tài khoản được cấp quyền mới có thể truy cập CMS.</p><CmsAccessRequestForm /></>}</div></>
}
