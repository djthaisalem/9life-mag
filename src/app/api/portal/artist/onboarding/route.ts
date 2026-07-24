import { NextResponse } from 'next/server'

import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { completeArtistProfileOnboarding } from '@/lib/site-user-session'

export async function POST() {
  const account = await getArtistPortalApiAccess('artist')
  if (!account) {
    return NextResponse.json({ ok: false, message: 'Bạn cần đăng nhập dashboard nghệ sĩ để hoàn tất hồ sơ.' }, { status: 401 })
  }

  const result = await completeArtistProfileOnboarding(account.id)
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: 'Chưa thể cộng sao cho hồ sơ này.' }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    awarded: result.awarded,
    stars: result.state.stars,
  })
}
