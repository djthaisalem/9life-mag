import 'server-only'

import { cmsTelegramBookingConfig } from '@/lib/cms-dashboard-data'
import {
  getBookingRequestsSnapshot,
  markBookingReminderSent,
  type BookingRequestRecord,
} from '@/lib/booking-requests'

function uniqueChannels(channels: string[]) {
  return [...new Set(channels.map((item) => item.trim()).filter(Boolean))]
}

async function sendTelegramMessage(input: { token: string; channel: string; message: string }) {
  if (!input.token || !input.channel) {
    return { ok: false, reason: 'missing-config' as const }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${input.token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: input.channel,
        text: input.message,
      }),
      cache: 'no-store',
    })

    return { ok: response.ok }
  } catch {
    return { ok: false, reason: 'request-failed' as const }
  }
}

export async function sendBookingTelegramNotice(request: BookingRequestRecord) {
  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  const channel = request.reminderConfig.telegramChannel || cmsTelegramBookingConfig.globalChannel
  const message = [
    '9LIFE MAG - YÊU CẦU MỚI',
    `Loại: ${request.typeLabel}`,
    `Nội dung: ${request.title}`,
    `Người gửi: ${request.requester}`,
    `Đơn vị: ${request.location}`,
    `Thời gian: ${request.schedule}`,
    `Chi tiết: ${request.detail}`,
  ].join('\n')

  return sendTelegramMessage({ token, channel, message })
}

function buildReminderMessage(request: BookingRequestRecord, label: string, note: string) {
  return [
    '9LIFE MAG - BOOKING ASSISTANT',
    `Loại: ${request.typeLabel}`,
    `Đối tượng: ${request.title}`,
    `Người gửi: ${request.requester}`,
    `Lịch: ${request.schedule}`,
    `Nhắc việc: ${label}`,
    `Ghi chú: ${note || request.reminderConfig.assistantNote || 'Không có ghi chú thêm.'}`,
  ].join('\n')
}

function isDue(value: string, now: Date) {
  if (!value) return false
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return false
  return target.getTime() <= now.getTime()
}

export async function dispatchDueBookingReminders(now = new Date()) {
  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  const requests = await getBookingRequestsSnapshot()
  const sent: Array<{ requestId: string; kind: string; channels: string[] }> = []

  for (const request of requests) {
    if (!['Đã xác nhận', 'Đã cọc', 'Hoàn tất'].includes(request.status)) {
      continue
    }

    const channels = uniqueChannels([
      request.reminderConfig.telegramChannel,
      request.reminderConfig.profileChannel,
    ])

    const reminderMap: Array<{
      dateValue: string
      dispatchKey: 'reminderSentAt' | 'soundcheckSentAt' | 'checkinSentAt' | 'followUpSentAt'
      label: string
    }> = [
      { dateValue: request.reminderConfig.reminderAt, dispatchKey: 'reminderSentAt', label: 'Nhắc xác nhận booking' },
      { dateValue: request.reminderConfig.soundcheckAt, dispatchKey: 'soundcheckSentAt', label: 'Nhắc soundcheck' },
      { dateValue: request.reminderConfig.checkinAt, dispatchKey: 'checkinSentAt', label: 'Nhắc check-in / tiếp đón' },
      { dateValue: request.reminderConfig.followUpAt, dispatchKey: 'followUpSentAt', label: 'Nhắc follow-up sau event' },
    ]

    for (const reminder of reminderMap) {
      if (!isDue(reminder.dateValue, now) || request.reminderDispatch[reminder.dispatchKey]) {
        continue
      }

      const message = buildReminderMessage(request, reminder.label, request.reminderConfig.assistantNote)
      for (const channel of channels) {
        await sendTelegramMessage({ token, channel, message })
      }

      await markBookingReminderSent({
        requestId: request.id,
        key: reminder.dispatchKey,
        timestamp: now.toISOString(),
      })

      sent.push({
        requestId: request.id,
        kind: reminder.label,
        channels,
      })
    }
  }

  return {
    ok: true,
    processedAt: now.toISOString(),
    sent,
  }
}
