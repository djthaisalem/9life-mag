'use client'

import { useState } from 'react'
import { useCmsCapability } from '@/components/cms-capability-provider'

export function CmsTelegramBookingConfigForm({ channel, tokenConfigured }: { channel: string; tokenConfigured: boolean }) {
  const capability = useCmsCapability('booking')
  const [value, setValue] = useState(channel)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')

  async function save() {
    setIsPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/cms/telegram-config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(capability ? { Authorization: `Bearer ${capability}` } : {}) },
        body: JSON.stringify({ channel: value }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || 'Không thể lưu cấu hình Telegram.')
      setMessage(result.message || 'Đã lưu cấu hình Telegram.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể lưu cấu hình Telegram.')
    } finally {
      setIsPending(false)
    }
  }

  return <div className="form-shell cms-embedded-form">
    <div className="cms-form-two">
      <div className="field"><label>Bot Telegram</label><input value={tokenConfigured ? 'Đã cấu hình trong VPS' : 'Chưa cấu hình TELEGRAM_BOT_TOKEN'} readOnly /></div>
      <div className="field"><label htmlFor="telegramBookingChannel">Nhóm / channel nhận thông báo</label><input id="telegramBookingChannel" value={value} onChange={(event) => setValue(event.target.value)} placeholder="-1001234567890 hoặc @channel" /></div>
    </div>
    <div className="cms-inline-actions"><button type="button" className="button" onClick={() => void save()} disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu cấu hình Telegram'}</button></div>
    {message ? <p className="cms-form-message" role="status">{message}</p> : null}
  </div>
}
