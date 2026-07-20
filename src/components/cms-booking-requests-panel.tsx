'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { CmsListTable } from '@/components/cms-list-table'
import type {
  BookingReminderConfig,
  BookingRequestRecord,
  BookingStatus,
} from '@/lib/booking-requests'

type BookingStatusTab = 'receiving' | 'accepted' | 'cancelled'

type CmsBookingRequestsPanelProps = {
  rows: BookingRequestRecord[]
  title: string
  description: string
  showTypeColumn?: boolean
}

const STATUS_TAB_LABELS: Record<BookingStatusTab, string> = {
  receiving: 'Đang tiếp nhận',
  accepted: 'Đã tiếp nhận',
  cancelled: 'Huỷ',
}

function getStatusTab(status: string): BookingStatusTab {
  if (['Đã xác nhận', 'Đã cọc', 'Hoàn tất', 'Đã tiếp nhận'].includes(status)) {
    return 'accepted'
  }

  if (['Huỷ', 'Đã huỷ', 'Từ chối'].includes(status)) {
    return 'cancelled'
  }

  return 'receiving'
}

function getAcceptedStatus(item: BookingRequestRecord): BookingStatus {
  return item.type === 'outlet' ? 'Đã cọc' : 'Đã xác nhận'
}

function getCancelledStatus(): BookingStatus {
  return 'Huỷ'
}

export function CmsBookingRequestsPanel({
  rows,
  title,
  description,
  showTypeColumn = true,
}: CmsBookingRequestsPanelProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<BookingStatusTab>('receiving')
  const [visibleCount, setVisibleCount] = useState(20)
  const [requestRows, setRequestRows] = useState(rows)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRequestRows(rows)
  }, [rows])

  const filteredRows = useMemo(
    () => requestRows.filter((row) => getStatusTab(row.status) === activeStatusTab),
    [requestRows, activeStatusTab],
  )

  const visibleRows = filteredRows.slice(0, visibleCount)
  const hasMore = filteredRows.length > visibleCount
  const selectedRequest = requestRows.find((row) => row.id === selectedRequestId) ?? null
  const updateSelectedRequest = (updater: (current: BookingRequestRecord) => BookingRequestRecord) => {
    if (!selectedRequestId) return
    setRequestRows((current) =>
      current.map((row) => (row.id === selectedRequestId ? updater(row) : row)),
    )
  }

  const persistStatus = (
    requestId: string,
    status: BookingRequestRecord['status'],
    nextTab: BookingStatusTab,
  ) => {
    setMessage('')
    startTransition(async () => {
      const response = await fetch('/api/cms/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          requestId,
          status,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        snapshot?: BookingRequestRecord[]
        message?: string
      }

      if (!result.ok || !result.snapshot) {
        setMessage(result.message ?? 'Không thể cập nhật trạng thái booking.')
        return
      }

      setRequestRows(result.snapshot)
      setActiveStatusTab(nextTab)
      setSelectedRequestId(null)
      setMessage(
        nextTab === 'accepted'
          ? 'Đã tiếp nhận booking và lưu xuống server.'
          : 'Đã huỷ booking và lưu xuống server.',
      )
    })
  }

  const persistReminderConfig = (requestId: string, reminderConfig: BookingReminderConfig) => {
    setMessage('')
    startTransition(async () => {
      const response = await fetch('/api/cms/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-reminder-config',
          requestId,
          reminderConfig,
        }),
      })

      const result = (await response.json()) as {
        ok: boolean
        snapshot?: BookingRequestRecord[]
        message?: string
      }

      if (!result.ok || !result.snapshot) {
        setMessage(result.message ?? 'Không thể lưu cấu hình nhắc việc.')
        return
      }

      setRequestRows(result.snapshot)
      setMessage('Đã lưu cấu hình nhắc việc Telegram xuống server.')
    })
  }

  return (
    <>
      <article className="panel">
        <div className="cms-panel-head-inline">
          <div>
            <p className="section-eyebrow">Requests</p>
            <h2>{title}</h2>
            <p className="muted">{description}</p>
          </div>
        </div>

        <div className="cms-booking-tabs">
          {(['receiving', 'accepted', 'cancelled'] as BookingStatusTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`cms-booking-tab ${activeStatusTab === tab ? 'cms-booking-tab-active' : ''}`}
              onClick={() => {
                setActiveStatusTab(tab)
                setVisibleCount(20)
              }}
            >
              {STATUS_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {message ? <p className="muted cms-booking-feedback">{message}</p> : null}

        <CmsListTable
          className="cms-table-booking"
          headers={['STT', showTypeColumn ? 'Đối tượng' : 'Tiêu đề', 'Người gửi', 'Khu vực', 'Lịch', 'Chi tiết', 'Trạng thái', 'Thao tác']}
          rows={visibleRows.map((item, index) => ({
            key: item.id,
            cells: [
              String(index + 1).padStart(2, '0'),
              <div key="title"><strong>{item.title}</strong><span>{item.typeLabel}</span></div>,
              item.requester,
              item.location,
              item.schedule,
              item.detail,
              <span key="status" className="cms-status-chip">{item.status}</span>,
              <div key="actions" className="cms-table-actions"><button type="button" className="cms-table-link" onClick={() => setSelectedRequestId(item.id)}>Xem</button></div>,
            ],
          }))}
          emptyLabel="Chưa có yêu cầu trong nhóm trạng thái này."
        />

        {hasMore ? (
          <div className="cms-inline-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setVisibleCount((current) => current + 20)}
            >
              Xem thêm
            </button>
          </div>
        ) : null}
      </article>

      {selectedRequest ? (
        <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true">
          <div className="cms-editor-modal cms-booking-detail-modal">
            <div className="cms-editor-modal-head">
              <div>
                <strong>{selectedRequest.title}</strong>
                <span>
                  {selectedRequest.typeLabel} • {selectedRequest.requester} • {selectedRequest.status}
                </span>
              </div>
              <button
                type="button"
                className="button-secondary button-secondary-compact"
                onClick={() => setSelectedRequestId(null)}
              >
                Đóng
              </button>
            </div>

            <div className="cms-editor-modal-form">
              <div className="cms-booking-detail-grid">
                <article className="cms-booking-detail-card">
                  <strong>Thông tin user đã gửi</strong>
                  <div className="cms-booking-detail-fields">
                    {selectedRequest.submittedFields.map((field) => (
                      <div
                        key={`${selectedRequest.id}-${field.label}`}
                        className="cms-booking-detail-field"
                      >
                        <span>{field.label}</span>
                        <strong>{field.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="cms-booking-detail-card">
                  <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
                    <div>
                      <strong>Cấu hình bot nhắc việc Telegram</strong>
                      <span>
                        Bot sẽ bám theo ngày giờ server và gửi vào nhóm tổng cùng nhóm riêng artist /
                        outlet đã config.
                      </span>
                    </div>
                  </div>

                  <div className="cms-form-two">
                    <div className="field">
                      <label htmlFor={`telegram-channel-${selectedRequest.id}`}>Nhóm tổng nhận nhắc</label>
                      <input
                        id={`telegram-channel-${selectedRequest.id}`}
                        value={selectedRequest.reminderConfig.telegramChannel}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              telegramChannel: event.target.value,
                            },
                          }))
                        }
                        placeholder="@booking_ops_total"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`profile-channel-${selectedRequest.id}`}>
                        Nhóm riêng artist / outlet
                      </label>
                      <input
                        id={`profile-channel-${selectedRequest.id}`}
                        value={selectedRequest.reminderConfig.profileChannel}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              profileChannel: event.target.value,
                            },
                          }))
                        }
                        placeholder="@artist_or_outlet_ops"
                      />
                    </div>
                  </div>

                  <div className="cms-form-two">
                    <div className="field">
                      <label htmlFor={`reminder-at-${selectedRequest.id}`}>Giờ nhắc xác nhận booking</label>
                      <input
                        id={`reminder-at-${selectedRequest.id}`}
                        type="datetime-local"
                        value={selectedRequest.reminderConfig.reminderAt}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              reminderAt: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`soundcheck-at-${selectedRequest.id}`}>Giờ nhắc soundcheck</label>
                      <input
                        id={`soundcheck-at-${selectedRequest.id}`}
                        type="datetime-local"
                        value={selectedRequest.reminderConfig.soundcheckAt}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              soundcheckAt: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="cms-form-two">
                    <div className="field">
                      <label htmlFor={`checkin-at-${selectedRequest.id}`}>
                        Giờ nhắc check-in / tiếp đón
                      </label>
                      <input
                        id={`checkin-at-${selectedRequest.id}`}
                        type="datetime-local"
                        value={selectedRequest.reminderConfig.checkinAt}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              checkinAt: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`follow-up-at-${selectedRequest.id}`}>Giờ nhắc follow-up</label>
                      <input
                        id={`follow-up-at-${selectedRequest.id}`}
                        type="datetime-local"
                        value={selectedRequest.reminderConfig.followUpAt}
                        onChange={(event) =>
                          updateSelectedRequest((current) => ({
                            ...current,
                            reminderConfig: {
                              ...current.reminderConfig,
                              followUpAt: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor={`assistant-note-${selectedRequest.id}`}>Kịch bản nhắc việc</label>
                    <input
                      id={`assistant-note-${selectedRequest.id}`}
                      value={selectedRequest.reminderConfig.assistantNote}
                      onChange={(event) =>
                        updateSelectedRequest((current) => ({
                          ...current,
                          reminderConfig: {
                            ...current.reminderConfig,
                            assistantNote: event.target.value,
                          },
                        }))
                      }
                      placeholder="Nhắc crew xác nhận booth, cọc, line-up, rider..."
                    />
                  </div>

                  <div className="cms-inline-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() =>
                        persistReminderConfig(selectedRequest.id, selectedRequest.reminderConfig)
                      }
                      disabled={isPending}
                    >
                      Lưu cấu hình nhắc việc
                    </button>
                  </div>
                </article>
              </div>

              <div className="cms-inline-actions">
                <a href={selectedRequest.href} className="button-secondary">
                  Mở profile liên quan
                </a>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    persistStatus(selectedRequest.id, getCancelledStatus(), 'cancelled')
                  }
                  disabled={isPending}
                >
                  Huỷ booking
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    persistStatus(selectedRequest.id, getAcceptedStatus(selectedRequest), 'accepted')
                  }
                  disabled={isPending}
                >
                  Tiếp nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
