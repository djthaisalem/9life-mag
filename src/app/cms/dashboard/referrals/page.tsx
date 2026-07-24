import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { CmsListTable } from '@/components/cms-list-table'
import { CmsReferralActions } from '@/components/cms-referral-actions'
import { getCmsReferralSnapshot, type CmsReferralRange } from '@/lib/share-referrals'
import { CmsListSearchForm } from '@/components/cms-list-search-form'

const statusLabels = {
  pending: 'Chờ truy cập',
  visited: 'Đang xác thực',
  rewarded: 'Đã thưởng sao',
  rejected: 'Không hợp lệ',
} as const

export default async function CmsReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; range?: string; from?: string; to?: string }> }) {
  const params = await searchParams
  const query = params.q?.slice(0, 120) ?? ''
  const range: CmsReferralRange = params.range === 'today' || params.range === 'week' || params.range === 'custom' ? params.range : 'all'
  const from = params.from?.slice(0, 10) ?? ''
  const to = params.to?.slice(0, 10) ?? ''
  const snapshot = await getCmsReferralSnapshot(Number(params.page) || 1, 20, { query, range, from, to })
  const buildHref = (page: number) => `/cms/dashboard/referrals?page=${page}&range=${range}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&q=${encodeURIComponent(query)}`

  return (
    <CmsDashboardShell activeKey="referrals" title="Quản lý Referral" description="Theo dõi link chia sẻ, trạng thái xác thực và sao thưởng để phát hiện hành vi bất thường trước khi vận hành quy mô lớn.">
      <section className="cms-stat-grid">
        <article className="cms-stat-card"><strong>{snapshot.total}</strong><span>Tổng link</span></article>
        <article className="cms-stat-card"><strong>{snapshot.counts.pending + snapshot.counts.visited}</strong><span>Đang chờ</span></article>
        <article className="cms-stat-card"><strong>{snapshot.counts.rewarded}</strong><span>Đã thưởng</span></article>
        <article className="cms-stat-card"><strong>{snapshot.counts.rejected}</strong><span>Không hợp lệ</span></article>
      </section>

      <article className="panel">
        <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
          <div><p className="section-eyebrow">Referral Ledger</p><h2>Danh sách link chia sẻ</h2><p className="cms-muted">Mỗi link chỉ thưởng sau khi có lượt truy cập độc lập, ở lại tối thiểu 30 giây và không phải chủ link.</p></div>
          <span className="pill">Trang {snapshot.page}/{snapshot.totalPages}</span>
        </div>
        <CmsListSearchForm className="cms-form-two" action="/cms/dashboard/referrals">
          <div className="field"><label htmlFor="referralSearch">User</label><input id="referralSearch" name="q" defaultValue={query} placeholder="ID user tạo link" /></div>
          <div className="field"><label htmlFor="referralRange">Khoảng thời gian</label><select id="referralRange" name="range" defaultValue={range}><option value="all">Toàn bộ thời gian</option><option value="today">Hôm nay</option><option value="week">Tuần này</option><option value="custom">Tùy chọn ngày</option></select></div>
          <div className="field"><label htmlFor="referralFrom">Từ ngày</label><input id="referralFrom" name="from" type="date" defaultValue={from} /></div>
          <div className="field"><label htmlFor="referralTo">Đến ngày</label><input id="referralTo" name="to" type="date" defaultValue={to} /></div>
          <div className="cms-inline-actions"><button type="submit" className="button-secondary">Lọc danh sách</button></div>
        </CmsListSearchForm>
        <CmsListTable
          headers={['Người tạo', 'Nội dung chia sẻ', 'Trạng thái', 'Tạo lúc', 'Xác thực / thưởng', 'Thao tác']}
          rows={snapshot.rows.map((row) => ({
            key: row.id,
            cells: [row.ownerId, row.path, `${row.visitCount} user · ${statusLabels[row.status]}`, new Date(row.createdAt).toLocaleString('vi-VN'), row.rewardedAt ? `Thưởng ${new Date(row.rewardedAt).toLocaleString('vi-VN')}` : row.visitedAt ? `Truy cập ${new Date(row.visitedAt).toLocaleString('vi-VN')}` : 'Chưa có lượt hợp lệ', <CmsReferralActions key="actions" referralId={row.id} />],
          }))}
          emptyLabel="Chưa có link referral nào được tạo."
        />
        {snapshot.totalPages > 1 ? <div className="cms-inline-actions">{Array.from({ length: snapshot.totalPages }, (_, index) => <Link key={index + 1} className={index + 1 === snapshot.page ? 'button-secondary cms-mode-button-active' : 'button-secondary'} href={buildHref(index + 1)}>{index + 1}</Link>)}</div> : null}
      </article>
    </CmsDashboardShell>
  )
}
