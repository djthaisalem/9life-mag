import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { getTrustedClientIp, guardMusicIssueReportAttempts } from '@/lib/request-guard'
import { sendTelegramOperationsNotice } from '@/lib/telegram'
import { loadPayloadClient } from '@/lib/payload-runtime'

type TrackDocument = {
  id: string | number
  title?: string
  slug?: string
  musicCode?: string
  submittedArtistSlug?: string
  author?: string
  trackType?: string
}

const reportSchema = z.object({
  trackId: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(180),
  artist: z.string().trim().max(160).default('9LIFE Artist'),
  sourceType: z.enum(['track', 'nonstop', 'remix']).default('track'),
})

export async function POST(request: Request) {
  try {
    const report = reportSchema.parse(await request.json())
    const guard = await guardMusicIssueReportAttempts(report.trackId, getTrustedClientIp(request.headers))
    if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: 429 })

    const payload = await loadPayloadClient()
    const storedTrack = await payload.findByID({
      collection: 'tracks', id: report.trackId, depth: 0, overrideAccess: true,
    }).catch(() => null) as TrackDocument | null

    const trackTitle = storedTrack?.title?.trim() || report.title
    const trackCode = storedTrack?.musicCode?.trim() || 'chưa có mã 6 số'
    const artist = storedTrack?.submittedArtistSlug?.trim() || storedTrack?.author?.trim() || report.artist
    const trackType = storedTrack?.trackType?.trim() || report.sourceType
    const trackLabel = `Track #${report.trackId} · ${trackTitle} · Mã ${trackCode}`

    await createPortalNotifications([{
      recipientKey: 'admin',
      title: `Báo cáo nhạc hư: ${trackLabel}`,
      body: `${artist} · ${trackType} · Người nghe báo không thể phát nội dung này.`,
      href: storedTrack?.slug ? `/cms/dashboard/music/${storedTrack.slug}` : '/cms/dashboard/music',
    }])

    const telegram = await sendTelegramOperationsNotice(
      `⚠️ <b>BÁO CÁO NHẠC HƯ</b>\n\n🎵 <b>${trackLabel}</b>\n👤 Nghệ sĩ: ${artist}\n🏷️ Loại: ${trackType}\n\nVui lòng kiểm tra file phát, quyền truy cập và R2 trong CMS Music.`,
    )

    return NextResponse.json({ ok: true, telegramSent: telegram.ok })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: 'Thông tin báo cáo nhạc chưa hợp lệ.' }, { status: 400 })
    }

    console.error('Music issue report failed', error)
    return NextResponse.json({ ok: false, message: 'Chưa thể gửi báo cáo lúc này. Vui lòng thử lại sau.' }, { status: 500 })
  }
}
