import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsStarsPaymentPanel } from '@/components/cms-stars-payment-panel'
import { getPaymentConfigSnapshot } from '@/lib/payment-config'
import { listSiteAccountsForCms } from '@/lib/site-user-session'
import { getStarTopupSnapshot } from '@/lib/star-topups'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CmsStarsPage() {
  const [initialSnapshot, paymentConfig, memberResult] = await Promise.all([
    getStarTopupSnapshot(),
    getPaymentConfigSnapshot(),
    listSiteAccountsForCms({ page: 1, limit: 20 }),
  ])

  return (
    <CmsDashboardShell
      activeKey="stars"
      title="Quản lý Sao / Thanh toán"
      description="Tạo QR nạp sao, đối soát giao dịch và quản lý số dư thành viên."
    >
      <CmsStarsPaymentPanel
        initialSnapshot={initialSnapshot}
        paymentConfig={paymentConfig}
        initialUsers={memberResult.users}
      />
    </CmsDashboardShell>
  )
}
