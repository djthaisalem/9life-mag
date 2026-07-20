'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { WalletEventType, WalletLedgerEntry } from '@/lib/wallet-ledger'

type CmsStarAnalyticsPanelProps = {
  entries: WalletLedgerEntry[]
  totalBalance: number
  userCount: number
  signupIssued: number
}

type RangeKey = 'today' | 'week' | 'month' | 'custom' | 'all'

const eventLabels: Record<WalletEventType, string> = {
  signup_bonus: 'Sao đăng ký',
  daily_claim: 'Sao đăng nhập hằng ngày',
  bonus_claim: 'Sao bonus',
  playlist_reward: 'Sao thưởng playlist',
  share_reward: 'Sao thưởng chia sẻ',
  topup_approved: 'Sao nạp đã duyệt',
  spend_general: 'Chi tiêu khác',
  spend_vote: 'Vote',
  spend_playback: 'Nghe nhạc',
  spend_download: 'Download',
  manual_adjustment: 'Điều chỉnh thủ công',
}

function getIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatStars(value: number) {
  return Math.abs(value).toLocaleString('vi-VN')
}

export function CmsStarAnalyticsPanel({ entries, totalBalance, userCount, signupIssued }: CmsStarAnalyticsPanelProps) {
  const [range, setRange] = useState<RangeKey>('month')
  const [fromDate, setFromDate] = useState(() => getIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [toDate, setToDate] = useState(() => getIsoDate(new Date()))

  const rangeStart = useMemo(() => {
    const now = new Date()
    if (range === 'all') return null
    if (range === 'custom') return new Date(`${fromDate}T00:00:00`)
    if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (range === 'week') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      return start
    }
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [fromDate, range])

  const rangeEnd = useMemo(() => {
    if (range === 'all') return null
    if (range === 'custom') {
      const end = new Date(`${toDate}T00:00:00`)
      end.setDate(end.getDate() + 1)
      return end
    }
    const end = new Date()
    end.setHours(24, 0, 0, 0)
    return end
  }, [range, toDate])

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const date = new Date(entry.createdAt)
    return (!rangeStart || date >= rangeStart) && (!rangeEnd || date < rangeEnd)
  }), [entries, rangeEnd, rangeStart])

  const metrics = useMemo(() => {
    const totalBy = (types: WalletEventType[], direction: 'positive' | 'absolute' = 'absolute') => filteredEntries
      .filter((entry) => types.includes(entry.eventType))
      .reduce((total, entry) => total + (direction === 'positive' ? Math.max(entry.amount, 0) : Math.abs(entry.amount)), 0)
    const signupRecorded = totalBy(['signup_bonus'], 'positive')
    const issued = signupRecorded + totalBy(['topup_approved', 'manual_adjustment'], 'positive') + (range === 'all' ? Math.max(0, signupIssued - signupRecorded) : 0)
    const earned = totalBy(['daily_claim', 'bonus_claim', 'playlist_reward', 'share_reward'], 'positive')
    const spent = filteredEntries.filter((entry) => entry.amount < 0).reduce((total, entry) => total + Math.abs(entry.amount), 0)

    return {
      issued,
      earned,
      spent,
      vote: totalBy(['spend_vote']),
      playback: totalBy(['spend_playback']),
      download: totalBy(['spend_download']),
      other: totalBy(['spend_general']),
      referralStars: totalBy(['share_reward'], 'positive'),
      referralRewards: filteredEntries.filter((entry) => entry.eventType === 'share_reward').length,
      transactions: filteredEntries.length,
    }
  }, [filteredEntries, range, signupIssued])

  const breakdown = useMemo(() => Object.entries(eventLabels).map(([eventType, label]) => {
    const matching = filteredEntries.filter((entry) => entry.eventType === eventType)
    return { eventType: eventType as WalletEventType, label, count: matching.length, total: matching.reduce((sum, entry) => sum + entry.amount, 0) }
  }).filter((item) => item.count > 0), [filteredEntries])

  const recentTransactions = useMemo(
    () => [...filteredEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20),
    [filteredEntries],
  )

  return (
    <section className="panel cms-star-analytics-panel">
      <div className="cms-panel-head-inline cms-star-analytics-head">
        <div><p className="section-eyebrow">Star economy</p><h2>Phân tích Sao</h2><p className="muted">Số dư là số hiện tại; các chỉ số còn lại được tính theo khoảng thời gian đã chọn và lấy từ wallet ledger.</p></div>
        <div className="cms-star-range-tabs">
          {([
            ['today', 'Hôm nay'], ['week', 'Tuần này'], ['month', 'Tháng này'], ['custom', 'Tùy chọn'], ['all', 'Toàn bộ'],
          ] as [RangeKey, string][]).map(([key, label]) => <button key={key} type="button" className={range === key ? 'cms-booking-tab cms-booking-tab-active' : 'cms-booking-tab'} onClick={() => setRange(key)}>{label}</button>)}
        </div>
      </div>

      {range === 'custom' ? <div className="cms-star-date-range"><label>Từ ngày<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label>Đến ngày<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></div> : null}

      <div className="cms-star-analytics-metrics">
        <article className="cms-star-analytics-balance"><span>Tổng sao hiện có</span><strong>{formatStars(totalBalance)}</strong><small>{userCount} ví user đang hoạt động</small></article>
        <article><span>Sao phát hành</span><strong>{formatStars(metrics.issued)}</strong><small>Đăng ký, nạp đã duyệt, điều chỉnh</small></article>
        <article><span>User đã dùng</span><strong>{formatStars(metrics.spent)}</strong><small>Toàn bộ sao đã trừ trong kỳ</small></article>
        <article><span>User kiếm lại</span><strong>{formatStars(metrics.earned)}</strong><small>Daily, bonus, playlist và referral</small></article>
        <Link href="/cms/dashboard/referrals" className="cms-star-analytics-referral"><span>Sao Referral</span><strong>{formatStars(metrics.referralStars)}</strong><small>{metrics.referralRewards} lượt chia sẻ hợp lệ trong kỳ</small></Link>
        <article><span>Sao Vote</span><strong>{formatStars(metrics.vote)}</strong><small>{metrics.vote} lượt đã ghi nhận</small></article>
        <article><span>Sao nghe nhạc</span><strong>{formatStars(metrics.playback)}</strong><small>{metrics.playback} lượt phát đã ghi nhận</small></article>
        <article><span>Sao Download</span><strong>{formatStars(metrics.download)}</strong><small>{metrics.download} lượt tải đã ghi nhận</small></article>
      </div>

      <div className="cms-star-analytics-summary"><span>{metrics.transactions.toLocaleString('vi-VN')} giao dịch trong kỳ</span><span>Chi tiêu chưa phân loại cũ: {formatStars(metrics.other)} sao</span></div>

      <div className="cms-star-ledger-table" role="table" aria-label="Phân rã giao dịch Sao">
        <div className="cms-star-ledger-row cms-star-ledger-head" role="row"><span>Loại giao dịch</span><span>Số lượt</span><span>Biến động sao</span></div>
        {breakdown.length ? breakdown.map((item) => <div key={item.eventType} className="cms-star-ledger-row" role="row"><strong>{item.label}</strong><span>{item.count.toLocaleString('vi-VN')}</span><span className={item.total < 0 ? 'cms-star-ledger-negative' : 'cms-star-ledger-positive'}>{item.total < 0 ? '-' : '+'}{formatStars(item.total)}</span></div>) : <div className="cms-star-analytics-empty">Chưa có giao dịch ledger trong khoảng thời gian này.</div>}
      </div>

      <div className="cms-star-transaction-section">
        <div className="cms-panel-head-inline"><div><p className="section-eyebrow">Recent Wallet Activity</p><h3>Giao dịch Sao mới nhất</h3></div><span className="pill">Hiển thị {recentTransactions.length}/20</span></div>
        <div className="cms-star-transaction-table" role="table" aria-label="Danh sách giao dịch Sao">
          <div className="cms-star-transaction-row cms-star-transaction-head" role="row"><span>Thời gian</span><span>User</span><span>Hoạt động</span><span>Nội dung</span><span>Biến động</span><span>Số dư sau</span></div>
          {recentTransactions.length ? recentTransactions.map((entry) => <div key={entry.id} className="cms-star-transaction-row" role="row"><span>{new Date(entry.createdAt).toLocaleString('vi-VN')}</span><span>{entry.userId}</span><strong>{eventLabels[entry.eventType]}</strong><span>{entry.note || entry.reference || 'Không có ghi chú'}</span><span className={entry.amount < 0 ? 'cms-star-ledger-negative' : 'cms-star-ledger-positive'}>{entry.amount < 0 ? '-' : '+'}{formatStars(entry.amount)}</span><span>{formatStars(entry.balanceAfter)}</span></div>) : <div className="cms-star-analytics-empty">Chưa có giao dịch trong khoảng thời gian này.</div>}
        </div>
      </div>
    </section>
  )
}
