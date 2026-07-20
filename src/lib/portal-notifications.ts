import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import { env } from '@/lib/env'
import { loadPayloadClient } from '@/lib/payload-runtime'
import { assignArtistToAgent } from '@/lib/site-user-session'

export type PortalNotification = { id: string; recipientKey: string; title: string; body: string; href: string; ticketId?: string; isRead: boolean; createdAt: string }
export type AgentChangeTicket = { id: string; artistAccountId: string; oldAgent: string; newAgent: string; reason: string; status: 'pending' | 'approved' | 'old_agent_rejected' | 'new_agent_rejected' | 'appealed'; oldAgentDecision: 'pending' | 'accepted' | 'rejected' | 'not_required'; newAgentDecision: 'pending' | 'accepted' | 'rejected' | 'not_required'; appealNote?: string; createdAt: string }
const storePath = path.join(process.cwd(), 'data', 'portal-notifications.json')
const ticketStorePath = path.join(process.cwd(), 'data', 'agent-change-tickets.json')

async function readFile<T>(filePath: string): Promise<T[]> { try { return JSON.parse(await fs.readFile(filePath, 'utf8')) as T[] } catch { return [] } }
async function writeFile<T>(filePath: string, rows: T[]) { await fs.mkdir(path.dirname(filePath), { recursive: true }); await fs.writeFile(filePath, JSON.stringify(rows, null, 2), 'utf8') }

export async function createPortalNotifications(rows: Array<Omit<PortalNotification, 'id' | 'isRead' | 'createdAt'>>) {
  const notifications = rows.map((row) => ({ ...row, id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, isRead: false, createdAt: new Date().toISOString() }))
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await Promise.all(notifications.map((notification) => payload.create({ collection: 'portal-notifications', data: notification })))
    return notifications
  }
  const existing = await readFile<PortalNotification>(storePath)
  await writeFile(storePath, [...notifications, ...existing].slice(0, 1000))
  return notifications
}

export async function getPortalNotifications(recipientKeys: string[]) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'portal-notifications', where: { recipientKey: { in: recipientKeys } }, sort: '-createdAt', limit: 30, depth: 0, pagination: false })
    return (result.docs as Array<Record<string, unknown>>).map((item) => ({ id: String(item.id), recipientKey: String(item.recipientKey ?? ''), title: String(item.title ?? ''), body: String(item.body ?? ''), href: String(item.href ?? ''), isRead: item.isRead === true, createdAt: String(item.createdAt ?? '') }))
  }
  const rows = await readFile<PortalNotification>(storePath)
  return rows.filter((item) => recipientKeys.includes(item.recipientKey)).slice(0, 30)
}

export async function markPortalNotificationRead(id: string, recipientKeys: string[]) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const existing = await payload.findByID({ collection: 'portal-notifications', id, depth: 0 }) as Record<string, unknown>
    if (!recipientKeys.includes(String(existing.recipientKey ?? ''))) return false
    await payload.update({ collection: 'portal-notifications', id, data: { isRead: true } })
    return true
  }
  const rows = await readFile<PortalNotification>(storePath)
  const item = rows.find((row) => row.id === id && recipientKeys.includes(row.recipientKey))
  if (!item) return false
  item.isRead = true
  await writeFile(storePath, rows)
  return true
}

export async function createAgentChangeTicket(input: { artistAccountId: string; oldAgent: string; newAgent: string; reason: string }) {
  const ticket: AgentChangeTicket = { id: `agent-ticket-${Date.now()}`, ...input, status: 'pending', oldAgentDecision: input.oldAgent === 'Independent Artist' ? 'not_required' : 'pending', newAgentDecision: input.newAgent === 'Independent Artist' ? 'not_required' : 'pending', createdAt: new Date().toISOString() }
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await payload.create({ collection: 'agent-change-tickets', data: ticket })
  } else {
    await writeFile(ticketStorePath, [ticket, ...(await readFile<AgentChangeTicket>(ticketStorePath))])
  }
  await createPortalNotifications([
    { recipientKey: input.artistAccountId, title: 'Đã gửi ticket đổi Agent', body: `Yêu cầu chuyển sang ${input.newAgent} đang chờ chấp thuận.`, href: '/tai-khoan/nghe-si/dashboard', ticketId: ticket.id },
    { recipientKey: 'admin', title: 'Yêu cầu đổi Agent', body: `Nghệ sĩ gửi yêu cầu chuyển từ ${input.oldAgent} sang ${input.newAgent}.`, href: '/cms/dashboard/users', ticketId: ticket.id },
    ...(ticket.oldAgentDecision === 'not_required' ? [] : [{ recipientKey: `agent:${input.oldAgent}`, title: 'Yêu cầu chuyển Agent', body: `Cần chấp thuận việc nghệ sĩ rời Agent ${input.oldAgent}.`, href: '/tai-khoan/nghe-si/manager/dashboard', ticketId: ticket.id }]),
    ...(ticket.newAgentDecision === 'not_required' ? [] : [{ recipientKey: `agent:${input.newAgent}`, title: 'Yêu cầu gia nhập Agent', body: `Cần chấp thuận quản lý nghệ sĩ mới cho Agent ${input.newAgent}.`, href: '/tai-khoan/nghe-si/manager/dashboard', ticketId: ticket.id }]),
  ])
  return ticket
}

function normalizeTicket(value: Record<string, unknown>): AgentChangeTicket {
  return {
    id: String(value.id), artistAccountId: String(value.artistAccountId ?? ''), oldAgent: String(value.oldAgent ?? ''), newAgent: String(value.newAgent ?? ''), reason: String(value.reason ?? ''),
    status: (value.status as AgentChangeTicket['status']) ?? 'pending', oldAgentDecision: (value.oldAgentDecision as AgentChangeTicket['oldAgentDecision']) ?? 'pending', newAgentDecision: (value.newAgentDecision as AgentChangeTicket['newAgentDecision']) ?? 'pending', appealNote: typeof value.appealNote === 'string' ? value.appealNote : undefined, createdAt: String(value.createdAt ?? ''),
  }
}

export async function getAgentChangeTickets(agent?: string, artistAccountId?: string) {
  const filter = (ticket: AgentChangeTicket) => (agent ? ticket.oldAgent === agent || ticket.newAgent === agent : true) && (artistAccountId ? ticket.artistAccountId === artistAccountId : true)
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    const result = await payload.find({ collection: 'agent-change-tickets', sort: '-createdAt', limit: 100, depth: 0, pagination: false })
    return (result.docs as Array<Record<string, unknown>>).map(normalizeTicket).filter(filter)
  }
  return (await readFile<AgentChangeTicket>(ticketStorePath)).filter(filter)
}

async function saveTicket(ticket: AgentChangeTicket) {
  if (env.SITE_USER_STORAGE_DRIVER === 'payload') {
    const payload = await loadPayloadClient()
    await payload.update({ collection: 'agent-change-tickets', id: ticket.id, data: ticket })
    return
  }
  const tickets = await readFile<AgentChangeTicket>(ticketStorePath)
  const index = tickets.findIndex((item) => item.id === ticket.id)
  if (index >= 0) tickets[index] = ticket
  await writeFile(ticketStorePath, tickets)
}

export async function decideAgentChangeTicket(input: { ticketId: string; agent: string; decision: 'accepted' | 'rejected' }) {
  const tickets = await getAgentChangeTickets(input.agent)
  const ticket = tickets.find((item) => item.id === input.ticketId)
  if (!ticket || ticket.status !== 'pending') throw new Error('ticket-not-available')
  if (ticket.oldAgent === input.agent) ticket.oldAgentDecision = input.decision
  if (ticket.newAgent === input.agent) ticket.newAgentDecision = input.decision

  if (ticket.oldAgentDecision === 'rejected') {
    ticket.status = 'old_agent_rejected'
    await createPortalNotifications([{ recipientKey: ticket.artistAccountId, title: 'Agent cũ chưa chấp thuận', body: 'Bạn có thể gửi khiếu nại để Admin xem xét yêu cầu đổi Agent.', href: '/tai-khoan/nghe-si/dashboard', ticketId: ticket.id }, { recipientKey: 'admin', title: 'Agent cũ từ chối chuyển giao', body: `Ticket đổi Agent ${ticket.id} cần được theo dõi nếu nghệ sĩ khiếu nại.`, href: '/cms/dashboard/users', ticketId: ticket.id }])
  } else if (ticket.newAgentDecision === 'rejected') {
    ticket.status = 'new_agent_rejected'
    await createPortalNotifications([{ recipientKey: ticket.artistAccountId, title: 'Agent mới chưa chấp thuận', body: 'Yêu cầu đổi Agent chưa thể hoàn tất. Bạn có thể chọn Agent khác.', href: '/tai-khoan/nghe-si/dashboard', ticketId: ticket.id }])
  } else if ((ticket.newAgentDecision === 'accepted' || ticket.newAgentDecision === 'not_required') && (ticket.oldAgentDecision === 'accepted' || ticket.oldAgentDecision === 'not_required')) {
    ticket.status = 'approved'
    await assignArtistToAgent(ticket.artistAccountId, ticket.newAgent === 'Independent Artist' ? undefined : ticket.newAgent)
    const destination = ticket.newAgent === 'Independent Artist' ? 'Nghệ sĩ tự do' : ticket.newAgent
    await createPortalNotifications([{ recipientKey: ticket.artistAccountId, title: 'Đã chuyển Agent thành công', body: `Profile và quyền quản lý booking của bạn đã được chuyển sang ${destination}.`, href: '/tai-khoan/nghe-si/dashboard', ticketId: ticket.id }, { recipientKey: `agent:${ticket.oldAgent}`, title: 'Đã hoàn tất chuyển giao', body: `Nghệ sĩ đã được chuyển sang ${destination}.`, href: '/tai-khoan/nghe-si/manager/dashboard', ticketId: ticket.id }, ...(ticket.newAgent === 'Independent Artist' ? [] : [{ recipientKey: `agent:${ticket.newAgent}`, title: 'Đã nhận nghệ sĩ mới', body: 'Quyền quản lý profile và booking đã được chuyển giao.', href: '/tai-khoan/nghe-si/manager/dashboard', ticketId: ticket.id }])])
  }
  await saveTicket(ticket)
  return ticket
}

export async function appealAgentChangeTicket(input: { ticketId: string; artistAccountId: string; note: string }) {
  const tickets = await getAgentChangeTickets(undefined, input.artistAccountId)
  const ticket = tickets.find((item) => item.id === input.ticketId && item.status === 'old_agent_rejected')
  if (!ticket) throw new Error('appeal-not-available')
  ticket.status = 'appealed'
  ticket.appealNote = input.note
  await saveTicket(ticket)
  await createPortalNotifications([{ recipientKey: 'admin', title: 'Khiếu nại đổi Agent', body: `Nghệ sĩ khiếu nại ticket ${ticket.id}: ${input.note || 'Không có ghi chú thêm.'}`, href: '/cms/dashboard/users', ticketId: ticket.id }, { recipientKey: ticket.artistAccountId, title: 'Đã gửi khiếu nại', body: 'Admin sẽ xem xét và phản hồi yêu cầu đổi Agent.', href: '/tai-khoan/nghe-si/dashboard', ticketId: ticket.id }])
  return ticket
}
