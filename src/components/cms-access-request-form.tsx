'use client'

import { useState, useTransition } from 'react'

export function CmsAccessRequestForm() {
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await fetch('/api/cms/access-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
      const result = await response.json() as { ok: boolean; message: string }
      setIsSuccess(result.ok); setMessage(result.message)
      if (result.ok) event.currentTarget.reset()
    })
  }
  return <form className="form-shell" onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="cmsRequestName">Họ và tên</label><input id="cmsRequestName" name="name" required placeholder="Tên người đăng ký" /></div>
    <div className="field"><label htmlFor="cmsRequestEmail">Email công việc</label><input id="cmsRequestEmail" name="email" type="email" required placeholder="name@company.com" /></div>
    <div className="field"><label htmlFor="cmsRequestOrganization">Đơn vị / thương hiệu</label><input id="cmsRequestOrganization" name="organization" placeholder="Tên agency, outlet hoặc team" /></div>
    <div className="field"><label htmlFor="cmsRequestRole">Quyền cần cấp</label><select id="cmsRequestRole" name="requestedRole" defaultValue="Editor"><option>Editor</option><option>Artist Ops</option><option>Music Ops</option><option>Finance Ops</option><option>Agent</option></select></div>
    <div className="field"><label htmlFor="cmsRequestNote">Ghi chú</label><textarea id="cmsRequestNote" name="note" placeholder="Nêu ngắn gọn phạm vi công việc cần truy cập." /></div>
    <div className="cms-login-actions"><button type="submit" className="button" disabled={isPending}>{isPending ? 'Đang gửi...' : 'Gửi yêu cầu tạo tài khoản'}</button></div>
    {message ? <p className="muted" style={{ color: isSuccess ? '#d7f6d5' : '#ffd0d0' }}>{message}</p> : null}
  </form>
}
