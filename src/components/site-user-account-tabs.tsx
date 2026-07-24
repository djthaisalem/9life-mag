'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SiteUserLoginForm } from '@/components/site-user-login-form'
import { SiteUserRegisterForm } from '@/components/site-user-register-form'
import {
  fetchUserAccessState,
  logoutUser,
  type StoredUserProfile,
} from '@/lib/client-user-access'

export function SiteUserAccountTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isChecking, setIsChecking] = useState(true)
  const [profile, setProfile] = useState<StoredUserProfile | null>(null)

  useEffect(() => {
    void fetchUserAccessState()
      .then((snapshot) => {
        setProfile(snapshot.state.isAuthenticated ? snapshot.profile : null)
      })
      .catch(() => setProfile(null))
      .finally(() => setIsChecking(false))
  }, [])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'register') {
      setActiveTab('register')
    }
  }, [])

  if (isChecking) {
    return <div className="account-auth-panel"><p className="muted">Đang kiểm tra phiên đăng nhập...</p></div>
  }

  if (profile) {
    const identity = profile.fullName || profile.email || 'Thành viên 9LIFE'
    return (
      <div className="account-auth-panel">
        <p className="section-eyebrow">Signed In</p>
        <h3>Chào mừng, {identity}</h3>
        <p className="muted">
          Phiên đăng nhập đang hoạt động. Bạn có thể tiếp tục nghe nhạc rồi quay lại dashboard
          mà không cần đăng nhập lại.
        </p>
        <div className="account-form-actions">
          <Link href="/tai-khoan/dashboard" className="button">
            Mở Dashboard User
          </Link>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              void logoutUser().then(() => setProfile(null))
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="account-auth-tabs" role="tablist" aria-label="Tài khoản user">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'login'}
          className={activeTab === 'login' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'}
          onClick={() => setActiveTab('login')}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'register'}
          className={activeTab === 'register' ? 'account-auth-tab account-auth-tab-active' : 'account-auth-tab'}
          onClick={() => setActiveTab('register')}
        >
          Tạo tài khoản
        </button>
      </div>
      {activeTab === 'login' ? (
        <div className="account-auth-panel">
          <p className="muted">
            Đăng nhập để theo dõi playlist, lịch sử hoạt động, sao và các yêu cầu đã gửi.
          </p>
          <SiteUserLoginForm />
        </div>
      ) : (
        <div className="account-auth-panel">
          <p className="muted">
            Tài khoản mới nhận 100 sao khởi tạo để bắt đầu vote, nghe nhạc và tham gia cộng đồng.
          </p>
          <SiteUserRegisterForm />
        </div>
      )}
    </>
  )
}
