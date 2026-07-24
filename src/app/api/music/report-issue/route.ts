import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPortalNotifications } from '@/lib/portal-notifications'
import { getTrustedClientIp, guardMusicIssueReportAttempts } from '@/lib/request-guard'
import { sendTelegramOperationsNotice } from '@/lib/telegram'

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

    const title = `Báo cáo nhạc hư: ${report.title}`
    const body = `${report.artist} · ${report.sourceType} · Mã track: ${report.trackId}. Người nghe báo không thể phát nội dung này.`

    await createPortalNotifications([
      {
        recipientKey: 'admin',
        title,
        body,
        href: '/cms/dashboard/music',
      },
    ])

    const telegram = await sendTelegramOperationsNotice(
      `⚠️ BÁO CÁO NHẠC HƯ\nTrack: ${report.title}\nNghệ sĩ: ${report.artist}\nLoại: ${report.sourceType}\nMã track: ${report.trackId}\n\nVui lòng kiểm tra file phát, quyền truy cập và R2 trong CMS Music.`,
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
