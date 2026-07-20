import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistBySlug } from '@/lib/artist-directory-data'
import { getArtistAgency, getArtistAgencyBySlug } from '@/lib/artist-agency-data'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getTrustedClientIp, guardContactRequestAttempts } from '@/lib/request-guard'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { getArtistAgentAssignments } from '@/lib/site-user-session'
import { createStudentApplication, getStudentApplications, updateStudentApplicationStatus } from '@/lib/student-applications'
import { getStudentRegistrationEnabled } from '@/lib/student-registration-settings'

const createSchema = z.object({
  targetType: z.enum(['artist', 'agent']),
  targetSlug: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().max(100).optional().default(''),
  experience: z.string().trim().max(2000).optional().default(''),
  learningGoal: z.string().trim().min(12).max(2000),
  availability: z.string().trim().max(200).optional().default(''),
  referenceLink: z.string().trim().url().max(500).optional().or(z.literal('')).default(''),
})

const statusSchema = z.object({ id: z.string().min(1), status: z.enum(['accepted', 'declined']) })

export async function POST(request: Request) {
  try {
    const input = createSchema.parse(await request.json())
    const guard = await guardContactRequestAttempts(input.email, getTrustedClientIp(await headers()))
    if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })

    const target = input.targetType === 'artist' ? getArtistBySlug(input.targetSlug) : getArtistAgencyBySlug(input.targetSlug)
    if (!target) return NextResponse.json({ ok: false, message: 'Hồ sơ tiếp nhận không còn khả dụng.' }, { status: 404 })
    if (!await getStudentRegistrationEnabled(input.targetType, input.targetSlug)) return NextResponse.json({ ok: false, message: 'Hồ sơ này hiện chưa mở nhận đăng ký học viên.' }, { status: 403 })

    const targetName = input.targetType === 'artist' ? target.name : target.name
    const application = await createStudentApplication({ ...input, targetName })
    const ownerNotifications = input.targetType === 'artist'
      ? (await getArtistAgentAssignments()).filter((account) => account.artistProfileSlug === input.targetSlug).map((account) => ({ recipientKey: account.id, title: 'Đơn đăng ký học viên mới', body: `${input.fullName} muốn đăng ký học cùng bạn.`, href: '/tai-khoan/nghe-si/dashboard/booking' }))
      : [{ recipientKey: `agent:${targetName}`, title: 'Đơn đăng ký học viên mới', body: `${input.fullName} muốn đăng ký học viên với Agent ${targetName}.`, href: '/tai-khoan/nghe-si/manager/dashboard' }]

    await createPortalNotifications([
      ...ownerNotifications,
      { recipientKey: 'admin', title: 'Đơn đăng ký học viên mới', body: `${input.fullName} đăng ký học viên cho ${targetName}. CMS chỉ theo dõi, chủ profile trực tiếp tiếp nhận.`, href: '/cms/dashboard/students' },
    ])

    return NextResponse.json({ ok: true, applicationId: application.id, message: 'Đã gửi đăng ký. Chủ profile sẽ liên hệ theo thông tin bạn cung cấp.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: error.issues[0]?.message ?? 'Thông tin đăng ký chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể gửi đăng ký lúc này. Vui lòng thử lại.' }, { status: 500 })
  }
}

async function getOwnerScope() {
  const artist = await getArtistPortalApiAccess('artist')
  if (artist?.artistProfileSlug) return { targetType: 'artist' as const, targetSlug: artist.artistProfileSlug }
  const manager = await getArtistPortalApiAccess('manager')
  const agency = manager?.managedAgent ? getArtistAgency(manager.managedAgent) : undefined
  if (agency) return { targetType: 'agent' as const, targetSlug: agency.slug }
  return null
}

export async function GET() {
  const scope = await getOwnerScope()
  if (!scope) return NextResponse.json({ ok: false, message: 'Bạn chưa có quyền tiếp nhận đơn học viên.' }, { status: 403 })
  return NextResponse.json({ ok: true, applications: await getStudentApplications(scope) })
}

export async function PATCH(request: Request) {
  try {
    const scope = await getOwnerScope()
    if (!scope) return NextResponse.json({ ok: false, message: 'Bạn chưa có quyền tiếp nhận đơn học viên.' }, { status: 403 })
    const input = statusSchema.parse(await request.json())
    const applications = await getStudentApplications(scope)
    if (!applications.some((application) => application.id === input.id)) return NextResponse.json({ ok: false, message: 'Đơn học viên không thuộc hồ sơ bạn quản lý.' }, { status: 404 })
    await updateStudentApplicationStatus(input.id, input.status)
    return NextResponse.json({ ok: true, applications: await getStudentApplications(scope) })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Trạng thái đơn chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể cập nhật đơn học viên.' }, { status: 500 })
  }
}
