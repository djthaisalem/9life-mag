'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { CmsListTable } from '@/components/cms-list-table'
import { useCmsStarsCapability } from '@/components/cms-capability-provider'
import type { CmsSiteAccount } from '@/lib/site-user-session'
import {
  paymentProviders,
  starPackages,
  type PaymentProviderId,
  type StarTopupRequest,
} from '@/lib/star-payment-shared'

type CmsStarsPaymentPanelProps = {
  initialSnapshot: {
    balances: Record<string, number>
    requests: StarTopupRequest[]
  }
  paymentConfig: {
    bankCode: string
    bankName: string
    accountNumber: string
    accountName: string
    qrTemplate: string
    momoPartnerCode: string
    momoAccessKeyPreview: string
    hasMomoSecretKey: boolean
    momoEndpoint: string
    viettelMerchantId: string
    hasViettelSecretKey: boolean
    viettelEndpoint: string
    paypalClientId: string
    hasPaypalSecretKey: boolean
    paypalBaseUrl: string
    defaultProviderVN: string
    defaultProviderGlobal: string
    processingMode: 'manual' | 'sandbox' | 'live'
    telegramTokenPreview: string
    hasTelegramToken: boolean
    telegramChannel: string
  }
  initialUsers?: CmsSiteAccount[]
}

type PaymentConfigForm = CmsStarsPaymentPanelProps['paymentConfig'] & {
  momoAccessKey: string
  momoSecretKey: string
  viettelSecretKey: string
  paypalSecretKey: string
}

type StarPackageRow = {
  id: string
  title: string
  amount: number
  stars: number
  benefits: string[]
}

type PackageEditorState = {
  id: string | null
  title: string
  amount: string
  stars: string
  benefits: string[]
}

const siteBenefitOptions = [
  'Vote nghệ sĩ / outlet',
  'Mở track mới',
  'Mở nonstop picks',
  'Mở top remix',
  'Download nhạc',
  'Nghe premium / exclusive',
  'Tạo playlist riêng',
  'Chia sẻ playlist',
  'Lưu yêu thích',
  'Ưu tiên nội dung sớm',
]

const defaultPackageBenefits: Record<string, string[]> = {
  'star-50': ['Vote nghệ sĩ / outlet', 'Mở track mới', 'Lưu yêu thích'],
  'star-120': ['Vote nghệ sĩ / outlet', 'Mở nonstop picks', 'Mở top remix', 'Tạo playlist riêng'],
  'star-300': ['Download nhạc', 'Nghe premium / exclusive', 'Chia sẻ playlist', 'Ưu tiên nội dung sớm'],
}

const emptyEditorState: PackageEditorState = {
  id: null,
  title: '',
  amount: '',
  stars: '',
  benefits: [],
}

export function CmsStarsPaymentPanel({
  initialSnapshot,
  paymentConfig,
  initialUsers = [],
}: CmsStarsPaymentPanelProps) {
  const starsCapability = useCmsStarsCapability()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [packageRows, setPackageRows] = useState<StarPackageRow[]>(
    starPackages.map((plan) => ({
      ...plan,
      benefits: defaultPackageBenefits[plan.id] ?? [],
    })),
  )
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [configState, setConfigState] = useState<PaymentConfigForm>({
    ...paymentConfig,
    momoAccessKey: '',
    momoSecretKey: '',
    viettelSecretKey: '',
    paypalSecretKey: '',
  })
  const [activeGatewayTab, setActiveGatewayTab] = useState<PaymentProviderId>('bank_qr')
  const [activeReviewTab, setActiveReviewTab] = useState<'reconciliation' | 'members' | 'rejected'>(
    'reconciliation',
  )
  const [editorState, setEditorState] = useState<PackageEditorState>(emptyEditorState)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(true)
  const [isPending, startTransition] = useTransition()

  const topUsers = useMemo(() => {
    return initialUsers
      .map((user) => ({
        ...user,
        liveStars: snapshot.balances[user.id] ?? user.stars,
      }))
      .slice(0, 20)
  }, [initialUsers, snapshot.balances])

  const pendingRequests = useMemo(
    () => snapshot.requests.filter((request) => request.status === 'pending').slice(0, 20),
    [snapshot.requests],
  )

  const rejectedRequests = useMemo(
    () => snapshot.requests.filter((request) => request.status === 'rejected').slice(0, 20),
    [snapshot.requests],
  )

  const openCreatePackage = () => {
    setEditorState(emptyEditorState)
    setIsEditorOpen(true)
  }

  const openEditPackage = (item: StarPackageRow) => {
    setEditorState({
      id: item.id,
      title: item.title,
      amount: String(item.amount),
      stars: String(item.stars),
      benefits: item.benefits,
    })
    setIsEditorOpen(true)
  }

  const closePackageEditor = () => {
    setIsEditorOpen(false)
    setEditorState(emptyEditorState)
  }

  const toggleEditorBenefit = (benefit: string) => {
    setEditorState((current) => ({
      ...current,
      benefits: current.benefits.includes(benefit)
        ? current.benefits.filter((entry) => entry !== benefit)
        : [...current.benefits, benefit],
    }))
  }

  const handleSavePackage = () => {
    const title = editorState.title.trim()
    const amount = Number(editorState.amount)
    const stars = Number(editorState.stars)

    if (!title || !Number.isFinite(amount) || !Number.isFinite(stars) || amount <= 0 || stars <= 0) {
      setIsSuccess(false)
      setMessage('Vui lòng nhập đầy đủ tên gói, số sao và số tiền hợp lệ.')
      return
    }

    if (editorState.benefits.length === 0) {
      setIsSuccess(false)
      setMessage('Vui lòng chọn ít nhất một quyền lợi cho gói sao.')
      return
    }

    if (editorState.id) {
      setPackageRows((current) =>
        current.map((item) =>
          item.id === editorState.id
            ? {
                ...item,
                title,
                amount,
                stars,
                benefits: editorState.benefits,
              }
            : item,
        ),
      )
      setIsSuccess(true)
      setMessage('Đã cập nhật gói sao.')
    } else {
      setPackageRows((current) => [
        {
          id: `custom-${Date.now()}`,
          title,
          amount,
          stars,
          benefits: editorState.benefits,
        },
        ...current,
      ])
      setIsSuccess(true)
      setMessage('Đã tạo gói sao mới.')
    }

    closePackageEditor()
  }

  const handleReview = (requestId: string, decision: 'approved' | 'rejected') => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/star-topups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'review',
          requestId,
          decision,
          note: reviewNotes[requestId] ?? '',
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message?: string
        snapshot?: typeof initialSnapshot
      }

      if (!result.ok || !result.snapshot) {
        setIsSuccess(false)
        setMessage(result.message ?? 'Không thể duyệt yêu cầu.')
        return
      }

      setSnapshot(result.snapshot)
      setActiveReviewTab(decision === 'approved' ? 'members' : 'rejected')
      setIsSuccess(true)
      setMessage(
        decision === 'approved'
          ? 'Đã chấp nhận yêu cầu và cộng sao vào user.'
          : 'Đã từ chối yêu cầu và chuyển sang danh sách từ chối.',
      )
    })
  }

  const handleSaveConfig = () => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/payment-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(starsCapability ? { Authorization: `Bearer ${starsCapability}` } : {}),
        },
        body: JSON.stringify({
          bankCode: configState.bankCode,
          bankName: configState.bankName,
          accountNumber: configState.accountNumber,
          accountName: configState.accountName,
          qrTemplate: configState.qrTemplate,
          momoPartnerCode: configState.momoPartnerCode,
          momoAccessKey: configState.momoAccessKey,
          momoSecretKey: configState.momoSecretKey,
          momoEndpoint: configState.momoEndpoint,
          viettelMerchantId: configState.viettelMerchantId,
          viettelSecretKey: configState.viettelSecretKey,
          viettelEndpoint: configState.viettelEndpoint,
          paypalClientId: configState.paypalClientId,
          paypalSecretKey: configState.paypalSecretKey,
          paypalBaseUrl: configState.paypalBaseUrl,
          defaultProviderVN: configState.defaultProviderVN,
          defaultProviderGlobal: configState.defaultProviderGlobal,
          processingMode: configState.processingMode,
          telegramChannel: configState.telegramChannel,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        message?: string
      }

      setIsSuccess(Boolean(result.ok))
      setMessage(result.message ?? 'Đã cập nhật cấu hình thanh toán.')
    })
  }

  const handleSaveTelegramChannel = () => {
    setMessage('')

    startTransition(async () => {
      const response = await fetch('/api/cms/telegram-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(starsCapability ? { Authorization: `Bearer ${starsCapability}` } : {}),
        },
        body: JSON.stringify({ channel: configState.telegramChannel }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      setIsSuccess(Boolean(result.ok))
      setMessage(result.message ?? 'Không thể lưu nhóm Telegram.')
    })
  }

  return (
    <>
      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Package Benefits</p>
            <h2>Gói sao và danh sách quyền lợi</h2>
          </div>
          <div className="cms-inline-actions">
            <button type="button" className="button" onClick={openCreatePackage}>
              Tạo gói sao
            </button>
          </div>
        </div>

        <CmsListTable
          className="cms-table-stars-package"
          headers={['Tên gói', 'Sao', 'Số tiền', 'Quyền lợi đang bật', 'Thao tác']}
          rows={packageRows.map((item) => ({
            key: item.id,
            cells: [
              <strong key="title">{item.title}</strong>,
              item.stars,
              `${item.amount.toLocaleString('vi-VN')} VND`,
              item.benefits.join(' · '),
              <div key="actions" className="cms-table-actions"><button type="button" className="cms-table-link" onClick={() => openEditPackage(item)}>Chỉnh sửa</button></div>,
            ],
          }))}
        />
      </article>

      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Gateway Config</p>
            <h2>Cấu hình cổng thanh toán</h2>
          </div>
        </div>

        <div className="cms-booking-tabs">
          {paymentProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={`cms-booking-tab ${activeGatewayTab === provider.id ? 'cms-booking-tab-active' : ''}`}
              onClick={() => setActiveGatewayTab(provider.id)}
            >
              {provider.label}
            </button>
          ))}
        </div>

        <div className="form-shell cms-embedded-form">
          {activeGatewayTab === 'bank_qr' ? (
            <>
              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="bankCode">Bank code / BIN</label>
                  <input
                    id="bankCode"
                    value={configState.bankCode}
                    onChange={(event) => setConfigState((prev) => ({ ...prev, bankCode: event.target.value }))}
                    placeholder="970422"
                  />
                </div>
                <div className="field">
                  <label htmlFor="bankAccount">Số tài khoản</label>
                  <input
                    id="bankAccount"
                    value={configState.accountNumber}
                    onChange={(event) => setConfigState((prev) => ({ ...prev, accountNumber: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="bankDisplayName">Tên ngân hàng</label>
                  <input
                    id="bankDisplayName"
                    value={configState.bankName}
                    onChange={(event) => setConfigState((prev) => ({ ...prev, bankName: event.target.value }))}
                    placeholder="Ngân hàng TMCP..."
                  />
                </div>
              </div>
              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="bankName">Tên chủ tài khoản</label>
                  <input
                    id="bankName"
                    value={configState.accountName}
                    onChange={(event) => setConfigState((prev) => ({ ...prev, accountName: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="qrTemplate">QR template</label>
                  <input
                    id="qrTemplate"
                    value={configState.qrTemplate}
                    onChange={(event) => setConfigState((prev) => ({ ...prev, qrTemplate: event.target.value }))}
                    placeholder="compact2"
                  />
                </div>
              </div>
            </>
          ) : null}

          {activeGatewayTab === 'momo' ? (
            <>
              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="momoCode">MoMo partner code</label>
                  <input id="momoCode" value={configState.momoPartnerCode} onChange={(event) => setConfigState((prev) => ({ ...prev, momoPartnerCode: event.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="momoEndpoint">MoMo endpoint</label>
                  <input id="momoEndpoint" value={configState.momoEndpoint} onChange={(event) => setConfigState((prev) => ({ ...prev, momoEndpoint: event.target.value }))} placeholder="https://test-payment.momo.vn/..." />
                </div>
              </div>
              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="momoAccessKey">MoMo access key</label>
                  <input id="momoAccessKey" type="password" value={configState.momoAccessKey} onChange={(event) => setConfigState((prev) => ({ ...prev, momoAccessKey: event.target.value }))} placeholder={configState.momoAccessKeyPreview || 'Nhập để lưu hoặc thay thế'} />
                </div>
                <div className="field">
                  <label htmlFor="momoSecretKey">MoMo secret key</label>
                  <input id="momoSecretKey" type="password" value={configState.momoSecretKey} onChange={(event) => setConfigState((prev) => ({ ...prev, momoSecretKey: event.target.value }))} placeholder={configState.hasMomoSecretKey ? 'Đã lưu, chỉ nhập khi thay đổi' : 'Nhập secret key'} />
                </div>
              </div>
            </>
          ) : null}

          {activeGatewayTab === 'viettel_money' ? (
            <>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="viettelId">Viettel Money merchant ID</label>
                <input
                  id="viettelId"
                  value={configState.viettelMerchantId}
                  onChange={(event) => setConfigState((prev) => ({ ...prev, viettelMerchantId: event.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="viettelEndpoint">Viettel Money endpoint</label>
                <input
                  id="viettelEndpoint"
                  value={configState.viettelEndpoint}
                  onChange={(event) => setConfigState((prev) => ({ ...prev, viettelEndpoint: event.target.value }))}
                  placeholder="https://api.viettelmoney.vn/..."
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="viettelSecretKey">Viettel Money secret key</label>
              <input id="viettelSecretKey" type="password" value={configState.viettelSecretKey} onChange={(event) => setConfigState((prev) => ({ ...prev, viettelSecretKey: event.target.value }))} placeholder={configState.hasViettelSecretKey ? 'Đã lưu, chỉ nhập khi thay đổi' : 'Nhập secret key'} />
            </div>
            </>
          ) : null}

          {activeGatewayTab === 'paypal' ? (
            <>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="paypalClientId">PayPal client ID</label>
                <input
                  id="paypalClientId"
                  value={configState.paypalClientId}
                  onChange={(event) => setConfigState((prev) => ({ ...prev, paypalClientId: event.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="paypalBaseUrl">PayPal base URL</label>
                <input
                  id="paypalBaseUrl"
                  value={configState.paypalBaseUrl}
                  onChange={(event) => setConfigState((prev) => ({ ...prev, paypalBaseUrl: event.target.value }))}
                  placeholder="https://www.paypal.com"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="paypalSecretKey">PayPal client secret</label>
              <input id="paypalSecretKey" type="password" value={configState.paypalSecretKey} onChange={(event) => setConfigState((prev) => ({ ...prev, paypalSecretKey: event.target.value }))} placeholder={configState.hasPaypalSecretKey ? 'Đã lưu, chỉ nhập khi thay đổi' : 'Nhập client secret'} />
            </div>
            </>
          ) : null}

          <div className="cms-form-two">
            <div className="field">
              <label htmlFor="providerVN">Provider mặc định VN</label>
              <input
                id="providerVN"
                value={configState.defaultProviderVN}
                onChange={(event) => setConfigState((prev) => ({ ...prev, defaultProviderVN: event.target.value }))}
                placeholder="bank_qr,momo,viettel_money"
              />
            </div>
            <div className="field">
              <label htmlFor="providerGlobal">Provider mặc định Global</label>
              <input
                id="providerGlobal"
                value={configState.defaultProviderGlobal}
                onChange={(event) => setConfigState((prev) => ({ ...prev, defaultProviderGlobal: event.target.value }))}
                placeholder="paypal"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="paymentProcessingMode">Chế độ xử lý thanh toán</label>
            <select
              id="paymentProcessingMode"
              value={configState.processingMode}
              onChange={(event) => setConfigState((prev) => ({ ...prev, processingMode: event.target.value as 'manual' | 'sandbox' | 'live' }))}
            >
              <option value="manual">Thủ công - chỉ tạo yêu cầu và đối soát</option>
              <option value="sandbox">Sandbox - kiểm thử API merchant</option>
              <option value="live">Live - chỉ bật sau khi webhook đã xác thực</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="telegramChannel">Telegram channel tổng</label>
            <input
              id="telegramChannel"
              value={configState.telegramChannel}
              onChange={(event) => setConfigState((prev) => ({ ...prev, telegramChannel: event.target.value }))}
              placeholder="@9lifemag_booking_ops"
            />
          </div>

          <div className="cms-inline-actions">
            <button type="button" className="button" onClick={handleSaveTelegramChannel} disabled={isPending}>
              Lưu Telegram
            </button>
            <button type="button" className="button-secondary" onClick={handleSaveConfig} disabled={isPending}>
              Lưu cấu hình cổng
            </button>
          </div>
        </div>
      </article>

      {message ? (
        <article className="panel">
          <p className="muted" style={{ color: isSuccess ? '#d7f6d5' : '#ffd0d0' }}>
            {message}
          </p>
        </article>
      ) : null}

      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Wallet Review</p>
            <h2>Đối soát và member wallet</h2>
          </div>
        </div>

        <div className="cms-booking-tabs">
          <button
            type="button"
            className={`cms-booking-tab ${activeReviewTab === 'reconciliation' ? 'cms-booking-tab-active' : ''}`}
            onClick={() => setActiveReviewTab('reconciliation')}
          >
            Đối soát
          </button>
          <button
            type="button"
            className={`cms-booking-tab ${activeReviewTab === 'members' ? 'cms-booking-tab-active' : ''}`}
            onClick={() => setActiveReviewTab('members')}
          >
            List member
          </button>
          <button
            type="button"
            className={`cms-booking-tab ${activeReviewTab === 'rejected' ? 'cms-booking-tab-active' : ''}`}
            onClick={() => setActiveReviewTab('rejected')}
          >
            Danh sách từ chối
          </button>
        </div>

        {activeReviewTab === 'reconciliation' ? (
          <CmsListTable
            className="cms-table-stars-review"
            headers={['User / gói', 'Mã giao dịch', 'Provider', 'Số tiền', 'Số sao', 'Xử lý']}
            rows={pendingRequests.map((request) => ({
              key: request.id,
              cells: [
                <div key="user"><strong>{request.userName}</strong><span>{request.packageTitle} · {request.createdAt.slice(0, 10)}</span></div>,
                <div key="references"><strong>{request.transactionRef}</strong>{request.providerOrderId ? <span>{request.providerOrderId}</span> : null}</div>,
                request.provider,
                `${request.amount.toLocaleString('vi-VN')} VND`,
                request.stars,
                <div key="actions" className="cms-review-actions"><input value={reviewNotes[request.id] ?? ''} onChange={(event) => setReviewNotes((prev) => ({ ...prev, [request.id]: event.target.value }))} placeholder="Ghi chú duyệt / từ chối" /><div className="cms-table-actions"><button type="button" className="cms-table-link" onClick={() => handleReview(request.id, 'approved')} disabled={isPending}>Chấp nhận</button><button type="button" className="cms-table-link" onClick={() => handleReview(request.id, 'rejected')} disabled={isPending}>Từ chối</button></div></div>,
              ],
            }))}
            emptyLabel="Chưa có yêu cầu cần đối soát."
          />
        ) : null}

        {activeReviewTab === 'members' ? (
          <CmsListTable
            className="cms-table-stars-members"
            headers={['STT', 'User', 'Liên hệ', 'Loại tài khoản', 'Ngày tạo', 'Sao', 'Thao tác']}
            rows={topUsers.map((user, index) => ({
              key: user.id,
              cells: [
                String(index + 1).padStart(2, '0'),
                <div key="user"><strong>{user.name}</strong><span>{user.isActive ? 'Đang hoạt động' : 'Tạm khóa'}</span></div>,
                user.email || user.phone || 'Chưa cập nhật',
                user.accountType === 'artist' ? 'Artist portal' : 'User',
                new Date(user.createdAt).toLocaleDateString('vi-VN'),
                user.liveStars,
                <div key="actions" className="cms-table-actions"><Link className="cms-table-link" href={`/cms/dashboard/users/${user.id}`}>Chỉnh sửa</Link></div>,
              ],
            }))}
            emptyLabel="Chưa có thành viên trong database."
          />
        ) : null}

        {activeReviewTab === 'rejected' ? (
          <CmsListTable
            className="cms-table-stars-rejected"
            headers={['User / gói', 'Mã giao dịch', 'Provider', 'Số tiền', 'Số sao', 'Lý do']}
            rows={rejectedRequests.map((request) => ({
              key: request.id,
              cells: [
                <div key="user"><strong>{request.userName}</strong><span>{request.packageTitle} · {request.createdAt.slice(0, 10)}</span></div>,
                <div key="references"><strong>{request.transactionRef}</strong>{request.providerOrderId ? <span>{request.providerOrderId}</span> : null}</div>,
                request.provider,
                `${request.amount.toLocaleString('vi-VN')} VND`,
                request.stars,
                request.note || request.userNotice,
              ],
            }))}
            emptyLabel="Chưa có yêu cầu bị từ chối."
          />
        ) : null}
      </article>

      {isEditorOpen ? (
        <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true">
          <div className="cms-editor-modal">
            <div className="cms-editor-modal-head">
              <div>
                <strong>{editorState.id ? 'Chỉnh sửa gói sao' : 'Tạo gói sao'}</strong>
                <span>{editorState.id ? 'Cập nhật quyền lợi và thông số gói' : 'Tạo gói mới và chọn quyền lợi áp dụng'}</span>
              </div>
              <button type="button" className="button-secondary button-secondary-compact" onClick={closePackageEditor}>
                Đóng
              </button>
            </div>

            <div className="cms-editor-modal-form">
              <div className="cms-form-two">
                <div className="field">
                  <label htmlFor="packageTitle">Tên gói</label>
                  <input
                    id="packageTitle"
                    value={editorState.title}
                    onChange={(event) => setEditorState((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Star Boost 180"
                  />
                </div>
                <div className="field">
                  <label htmlFor="packageStars">Số sao</label>
                  <input
                    id="packageStars"
                    type="number"
                    min="1"
                    value={editorState.stars}
                    onChange={(event) => setEditorState((current) => ({ ...current, stars: event.target.value }))}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="packageAmount">Số tiền (VND)</label>
                <input
                  id="packageAmount"
                  type="number"
                  min="1000"
                  value={editorState.amount}
                  onChange={(event) => setEditorState((current) => ({ ...current, amount: event.target.value }))}
                />
              </div>

              <div className="field">
                <label>Chọn quyền lợi</label>
                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  {siteBenefitOptions.map((benefit) => (
                    <label
                      key={benefit}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '14px',
                        padding: '0.8rem 0.9rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editorState.benefits.includes(benefit)}
                        onChange={() => toggleEditorBenefit(benefit)}
                      />
                      <span>{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="cms-inline-actions">
                <button type="button" className="button-secondary" onClick={closePackageEditor}>
                  Hủy
                </button>
                <button type="button" className="button" onClick={handleSavePackage}>
                  Lưu gói sao
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
