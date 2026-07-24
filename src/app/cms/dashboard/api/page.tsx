import { CmsAuthConfigForm } from '@/components/cms-auth-config-form'
import { CmsR2ConfigForm } from '@/components/cms-r2-config-form'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { getAuthConfigSnapshot } from '@/lib/auth-config'
import { cmsApiGroups, cmsCollections } from '@/lib/cms-data'
import { getR2ConfigSnapshot } from '@/lib/r2-config'
import { env } from '@/lib/env'

export default async function CmsApiPage() {
  const r2Config = await getR2ConfigSnapshot()
  const authConfig = await getAuthConfigSnapshot()

  return (
    <CmsDashboardShell
      activeKey="api"
      title="API / Bảo mật"
      description="Workspace quản lý cấu trúc dữ liệu, kết nối dịch vụ ngoài và các nguyên tắc backend để site chính lẫn CMS vận hành an toàn, rõ quyền và dễ audit."
    >
      <div className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline">
            <div>
              <p className="section-eyebrow">Account Access</p>
              <h2>Google / Facebook / Quên mật khẩu</h2>
              <p className="muted">
                Lưu tập trung cấu hình social login và email reset password để site chính, user dashboard và artist portal dùng chung một chuẩn xác thực.
              </p>
            </div>
          </div>

          <CmsAuthConfigForm initialValues={authConfig} />
        </article>

        <article className="panel">
          <div className="cms-panel-head-inline">
            <div>
              <p className="section-eyebrow">Cloud Storage</p>
              <h2>Cloudflare R2</h2>
              <p className="muted">
                Điền thông tin R2 tại đây để music upload, media kit, cover image và các file hệ thống cùng dùng chung một cấu hình server-side.
              </p>
            </div>
          </div>

          <CmsR2ConfigForm
            initialValues={{
              accountId: r2Config.accountId,
              bucket: r2Config.bucket,
              endpoint: r2Config.endpoint,
              publicBaseUrl: r2Config.publicBaseUrl,
              accessKeyPreview: r2Config.accessKeyPreview,
              hasSecretAccessKey: r2Config.hasSecretAccessKey,
              isConfigured: r2Config.isConfigured,
            }}
          />
        </article>

        <article className="panel">
          <div className="cms-panel-head-inline">
            <div>
              <p className="section-eyebrow">Telegram Recovery</p>
              <h2>Khôi phục mật khẩu qua Telegram</h2>
              <p className="muted">Token bot và webhook secret chỉ được đặt trên VPS, không hiển thị trong CMS.</p>
            </div>
          </div>
          <div className="cms-overview-stats cms-overview-stats-2">
            <article className="metric"><strong>{env.TELEGRAM_BOT_TOKEN ? 'Ready' : 'Missing'}</strong><span>TELEGRAM_BOT_TOKEN</span></article>
            <article className="metric"><strong>{env.TELEGRAM_BOT_USERNAME ? 'Ready' : 'Missing'}</strong><span>TELEGRAM_BOT_USERNAME</span></article>
            <article className="metric"><strong>{env.TELEGRAM_WEBHOOK_SECRET ? 'Ready' : 'Missing'}</strong><span>TELEGRAM_WEBHOOK_SECRET</span></article>
            <article className="metric"><strong>{env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME && env.TELEGRAM_WEBHOOK_SECRET ? 'Ready' : 'Pending'}</strong><span>Trạng thái reset Telegram</span></article>
          </div>
          <div className="field-note">Webhook cần khai báo tại BotFather hoặc Telegram API: <code>{env.NEXT_PUBLIC_SITE_URL}/api/telegram/password-reset</code></div>
        </article>

        <article className="panel">
          <h2>Collections cốt lõi</h2>
          <div className="cms-collection-list">
            {cmsCollections.map((item) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Internal Routes</p>
            <h2>Nhóm API nội bộ</h2>
            <p className="muted">
              Riêng phần music và media nên đi qua signed upload cùng backend validation để không lộ secret, không ghi nhầm dữ liệu và dễ kiểm soát quyền truy cập.
            </p>
          </div>
        </div>

        <div className="cms-api-list">
          {cmsApiGroups.map((group) => (
            <div key={group.title} className="cms-api-card">
              <h3>{group.title}</h3>
              {group.routes.map((route) => (
                <p key={route} className="muted">
                  {route}
                </p>
              ))}
            </div>
          ))}
        </div>
      </article>
    </CmsDashboardShell>
  )
}
