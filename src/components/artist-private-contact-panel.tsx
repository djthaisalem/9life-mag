'use client'

import { useEffect, useState } from 'react'

type Contact = { email: string; phone: string; facebook: string; telegram: string; zalo: string; tiktok: string }
const empty: Contact = { email: '', phone: '', facebook: '', telegram: '', zalo: '', tiktok: '' }
const fields: Array<[keyof Contact, string, string]> = [['email', 'Email', 'email'], ['phone', 'SĐT', 'tel'], ['facebook', 'Facebook', 'url'], ['telegram', 'Telegram', 'text'], ['zalo', 'Zalo', 'text'], ['tiktok', 'TikTok', 'url']]

export function ArtistPrivateContactPanel() {
  const [contact, setContact] = useState<Contact>(empty)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { void fetch('/api/portal/artist/contact-channels').then((response) => response.json()).then((result) => { if (result.ok) setContact(result.contact) }) }, [])
  const filled = Object.values(contact).filter(Boolean).length
  const save = async () => { if (filled < 2) { setMessage('Vui lòng cập nhật tối thiểu 2 kênh để đội booking có thể liên lạc.'); return } const response = await fetch('/api/portal/artist/contact-channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact) }); const result = await response.json(); setMessage(result.ok ? 'Đã lưu kênh liên hệ bảo mật.' : result.message); if (result.ok) setOpen(false) }
  return <article className="artist-dashboard-panel"><div className="artist-dashboard-panel-head"><div><p className="section-eyebrow">Private contact</p><h2>Kênh liên hệ nhận show</h2><p className="artist-editor-panel-note">Chỉ nghệ sĩ, agent quản lý và CMS admin được xem. Hãy cập nhật tối thiểu 2 kênh.</p></div><button type="button" className="button-secondary" onClick={() => setOpen(true)}>Chỉnh sửa</button></div><div className="artist-dashboard-update-list"><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>{filled}/6 kênh liên hệ đã cập nhật</p></div><div className="artist-dashboard-update-item"><span className="account-benefit-dot" /><p>Ưu tiên Email và SĐT để xử lý booking nhanh.</p></div></div>{message ? <p className="artist-editor-panel-note">{message}</p> : null}{open ? <div className="cms-editor-modal-overlay" role="dialog" aria-modal="true"><div className="cms-editor-modal"><div className="cms-editor-modal-head"><div><strong>Cập nhật kênh liên hệ</strong><span>Thông tin này không hiển thị trên profile công khai.</span></div><button type="button" className="button-secondary" onClick={() => setOpen(false)}>Đóng</button></div><div className="cms-editor-modal-form">{fields.map(([key, label, type]) => <div className="field" key={key}><label htmlFor={`contact-${key}`}>{label}</label><input id={`contact-${key}`} type={type} value={contact[key]} onChange={(event) => setContact((current) => ({ ...current, [key]: event.target.value }))} /></div>)}<div className="cms-inline-actions"><button type="button" className="button" onClick={() => void save()}>Lưu kênh liên hệ</button></div></div></div></div> : null}</article>
}
