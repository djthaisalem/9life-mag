'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Notice = { id: string; title: string; body: string; href: string; isRead: boolean; createdAt: string }

export function PortalNotificationCenter() {
  const [items, setItems] = useState<Notice[]>([])
  const [open, setOpen] = useState(false)
  useEffect(() => { void fetch('/api/portal/notifications', { cache: 'no-store' }).then(async (response) => ({ response, body: await response.json() as { ok: boolean; notifications?: Notice[] } })).then(({ response, body }) => { if (response.ok && body.ok) setItems(body.notifications ?? []) }).catch(() => undefined) }, [])
  const unread = items.filter((item) => !item.isRead).length
  async function read(item: Notice) { if (!item.isRead) { await fetch('/api/portal/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) }); setItems((current) => current.map((row) => row.id === item.id ? { ...row, isRead: true } : row)) } setOpen(false) }
  return <div className="portal-notification-center"><button type="button" className="button-secondary portal-notification-trigger" onClick={() => setOpen((current) => !current)}>Thông báo{unread ? <b>{unread}</b> : null}</button>{open ? <div className="portal-notification-menu">{items.length ? items.map((item) => <Link key={item.id} href={item.href || '#'} className={item.isRead ? 'portal-notification-item' : 'portal-notification-item portal-notification-item-new'} onClick={() => void read(item)}><strong>{item.title}</strong><span>{item.body}</span>{!item.isRead ? <small>Mới</small> : null}</Link>) : <p className="muted">Chưa có thông báo mới.</p>}</div> : null}</div>
}
