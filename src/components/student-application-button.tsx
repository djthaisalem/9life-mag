'use client'

import { GraduationCap, X } from 'lucide-react'
import { FormEvent, useState } from 'react'

type StudentApplicationButtonProps = {
  targetType: 'artist' | 'agent'
  targetSlug: string
  targetName: string
  compact?: boolean
}

export function StudentApplicationButton({ targetType, targetSlug, targetName, compact = false }: StudentApplicationButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/student-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType, targetSlug, fullName: form.get('fullName'), email: form.get('email'), phone: form.get('phone'), city: form.get('city'), experience: form.get('experience'), learningGoal: form.get('learningGoal'), availability: form.get('availability'), referenceLink: form.get('referenceLink') }) })
    const result = await response.json() as { ok?: boolean; message?: string }
    setPending(false)
    setMessage(result.message ?? (result.ok ? 'Đã gửi đăng ký.' : 'Chưa thể gửi đăng ký.'))
    if (result.ok) event.currentTarget.reset()
  }

  return <>
    <button type="button" className={compact ? 'button-secondary student-application-trigger' : 'button student-application-trigger'} onClick={() => setOpen(true)}><GraduationCap size={16} /> Đăng ký học viên</button>
    {open ? <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true" aria-label={`Đăng ký học viên với ${targetName}`}><div className="cms-editor-modal student-application-modal"><div className="cms-editor-modal-head"><div><strong>Đăng ký học viên</strong><span>Gửi hồ sơ trực tiếp đến {targetType === 'artist' ? 'nghệ sĩ' : 'Agent'} {targetName}. Thông tin chỉ được chủ profile và quản trị viên hệ thống xem.</span></div><button type="button" className="button-secondary" onClick={() => setOpen(false)} aria-label="Đóng form"><X size={16} /></button></div><form className="cms-editor-modal-form" onSubmit={(event) => void submit(event)}><div className="cms-form-two"><div className="field"><label htmlFor="studentFullName">Họ và tên</label><input id="studentFullName" name="fullName" required /></div><div className="field"><label htmlFor="studentCity">Khu vực đang sống</label><input id="studentCity" name="city" placeholder="TP.HCM, Hà Nội..." /></div><div className="field"><label htmlFor="studentEmail">Email</label><input id="studentEmail" name="email" type="email" required /></div><div className="field"><label htmlFor="studentPhone">Số điện thoại / Zalo</label><input id="studentPhone" name="phone" required /></div></div><div className="field"><label htmlFor="studentGoal">Mục tiêu học tập</label><textarea id="studentGoal" name="learningGoal" required placeholder="Bạn muốn học nội dung gì, mục tiêu trong 3-6 tháng tới là gì?" /></div><div className="field"><label htmlFor="studentExperience">Kinh nghiệm hiện tại</label><textarea id="studentExperience" name="experience" placeholder="Đã từng học, biểu diễn, sử dụng phần mềm hoặc có sản phẩm nào chưa?" /></div><div className="cms-form-two"><div className="field"><label htmlFor="studentAvailability">Thời gian có thể học</label><input id="studentAvailability" name="availability" placeholder="Tối, cuối tuần..." /></div><div className="field"><label htmlFor="studentReference">Link tham khảo</label><input id="studentReference" name="referenceLink" type="url" placeholder="SoundCloud, Mixcloud, Facebook..." /></div></div>{message ? <p className="form-feedback">{message}</p> : null}<div className="cms-inline-actions"><button type="submit" className="button" disabled={pending}>{pending ? 'Đang gửi...' : 'Gửi đăng ký học viên'}</button><button type="button" className="button-secondary" onClick={() => setOpen(false)}>Để sau</button></div></form></div></div> : null}
  </>
}
