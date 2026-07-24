'use client'

import Link from 'next/link'

type StarTopupDialogProps = {
  open: boolean
  onClose: () => void
}

export function StarTopupDialog({ open, onClose }: StarTopupDialogProps) {
  if (!open) return null

  return (
    <div className="login-gate-overlay" role="dialog" aria-modal="true" aria-labelledby="star-topup-dialog-title">
      <div className="login-gate-card">
        <div className="player-kicker">Số dư chưa đủ</div>
        <h3 id="star-topup-dialog-title">Bạn cần nạp thêm sao để tiếp tục</h3>
        <p className="muted">
          Hệ thống chưa thực hiện thao tác này. Sau khi nạp sao, bạn có thể quay lại nghe, tải nội dung hoặc vote.
        </p>
        <div className="login-gate-actions">
          <button type="button" className="button-secondary" onClick={onClose}>Để sau</button>
          <Link href="/tai-khoan/dashboard#star-wallet" className="button" onClick={onClose}>Nạp sao</Link>
        </div>
      </div>
    </div>
  )
}
