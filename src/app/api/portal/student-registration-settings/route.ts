import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistAgency } from '@/lib/artist-agency-data'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getStudentRegistrationEnabled, setStudentRegistrationEnabled } from '@/lib/student-registration-settings'

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
  if (!scope) return NextResponse.json({ ok: false, message: 'Bạn chưa có quyền cấu hình đăng ký học viên.' }, { status: 403 })
  return NextResponse.json({ ok: true, ...scope, enabled: await getStudentRegistrationEnabled(scope.targetType, scope.targetSlug) })
}

export async function PATCH(request: Request) {
  try {
    const scope = await getOwnerScope()
    if (!scope) return NextResponse.json({ ok: false, message: 'Bạn chưa có quyền cấu hình đăng ký học viên.' }, { status: 403 })
    const input = z.object({ enabled: z.boolean() }).parse(await request.json())
    await setStudentRegistrationEnabled(scope.targetType, scope.targetSlug, input.enabled)
    return NextResponse.json({ ok: true, ...scope, enabled: input.enabled })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, message: 'Thiết lập chưa hợp lệ.' }, { status: 400 })
    return NextResponse.json({ ok: false, message: 'Chưa thể lưu thiết lập.' }, { status: 500 })
  }
}
