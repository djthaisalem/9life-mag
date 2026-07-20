import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsStarsPaymentPanel } from '@/components/cms-stars-payment-panel'
import { getPaymentConfigSnapshot } from '@/lib/payment-config'
import { getStarTopupSnapshot } from '@/lib/star-topups'

export default async function CmsStarsPage() {
  const [initialSnapshot, paymentConfig] = await Promise.all([getStarTopupSnapshot(), getPaymentConfigSnapshot()])
  return <CmsDashboardShell activeKey="stars" title="Quản lý Sao / Thanh toán" description="Tạo QR nạp sao, đối soát giao dịch và cộng sao vào tài khoản user.">
    <CmsStarsPaymentPanel initialSnapshot={initialSnapshot} paymentConfig={paymentConfig} />
  </CmsDashboardShell>
}
