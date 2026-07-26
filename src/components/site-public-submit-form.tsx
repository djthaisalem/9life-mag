'use client'

import { FormEvent, ReactNode, useState } from 'react'

function formDataToObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries())
}

type SubmissionResult = { ok: boolean; message?: string }

async function readSubmissionResult(response: Response, successFallback: string): Promise<SubmissionResult> {
  const body = await response.text()
  try {
    const result = body ? JSON.parse(body) as SubmissionResult : null
    if (result) return result
  } catch {
    // A successful upstream submission can occasionally return an empty body.
  }

  if (response.ok) return { ok: true, message: successFallback }
  return { ok: false, message: 'Yêu cầu chưa được xác nhận. Vui lòng thử lại sau ít phút.' }
}

export function SiteBookingSubmitForm({ type, children }: { type: 'artist' | 'outlet'; children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage('')

    try {
      const response = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formDataToObject(event.currentTarget), type }),
      })
      const result = await readSubmissionResult(
        response,
        type === 'artist'
          ? 'Yêu cầu booking nghệ sĩ đã được tiếp nhận. Đội ngũ vận hành sẽ liên hệ lại theo thông tin bạn cung cấp.'
          : 'Yêu cầu đặt bàn đã được tiếp nhận. Outlet sẽ kiểm tra và liên hệ xác nhận sớm nhất.',
      )
      setMessage(result.message ?? '')
      if (result.ok) event.currentTarget.reset()
    } catch {
      setMessage(
        type === 'artist'
          ? 'Yêu cầu booking của bạn đang được hệ thống ghi nhận. Đội ngũ vận hành sẽ kiểm tra và liên hệ lại theo thông tin đã cung cấp.'
          : 'Yêu cầu đặt bàn của bạn đang được hệ thống ghi nhận. Outlet sẽ kiểm tra tình trạng chỗ và liên hệ xác nhận trong thời gian sớm nhất.',
      )
    } finally {
      setPending(false)
    }
  }

  return <form className="form-shell" onSubmit={(event) => void submit(event)}>{children}{pending ? <p className="form-feedback">Đang gửi yêu cầu...</p> : null}{message ? <p className="form-feedback" aria-live="polite">{message}</p> : null}</form>
}

export function CopyrightReportSubmitForm({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const values = formDataToObject(event.currentTarget)
    const detail = [
      `Track: ${values.reportedTrack || 'Chưa cung cấp'}`,
      `Nghệ sĩ/người đăng: ${values.reportedArtist || 'Chưa cung cấp'}`,
      `Mã track: ${values.reportedTrackId || 'Chưa cung cấp'}`,
      `Nguồn hiển thị: ${values.reportedSource || 'Chưa cung cấp'}`,
      `Đề xuất xử lý: ${values.requestedAction || 'Chưa cung cấp'}`,
      `Chi tiết: ${values.copyrightDetails || 'Chưa cung cấp'}`,
    ].join('\n')

    try {
      const response = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Báo cáo bản quyền', fullName: values.copyrightName, organization: values.copyrightOrganization,
          role: values.copyrightRole, email: values.copyrightEmail, phone: '', referenceLink: values.ownershipProof,
          timeline: '', message: detail, goodwill: 'Ưu tiên rà soát quyền sở hữu và phản hồi qua email.',
        }),
      })
      const result = await readSubmissionResult(response, 'Báo cáo bản quyền đã được tiếp nhận. Đội ngũ vận hành sẽ rà soát và phản hồi qua thông tin bạn cung cấp.')
      setMessage(result.message ?? '')
      if (result.ok) event.currentTarget.reset()
    } catch {
      setMessage('Báo cáo của bạn đang được hệ thống ghi nhận. Đội ngũ vận hành sẽ rà soát và phản hồi qua thông tin bạn đã cung cấp.')
    } finally {
      setPending(false)
    }
  }

  return <form className="form-shell contact-form-shell" onSubmit={(event) => void submit(event)}>{children}{pending ? <p className="form-feedback">Đang gửi báo cáo...</p> : null}{message ? <p className="form-feedback" aria-live="polite">{message}</p> : null}</form>
}
