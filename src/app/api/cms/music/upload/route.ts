import { NextResponse } from 'next/server'
import { requireCmsApiAccess } from '@/lib/cms-access'
import { processMusicUpload } from '@/lib/music-upload-pipeline'

export const runtime = 'nodejs'
export const maxDuration = 300

const messageByError: Record<string, string> = {
  r2_music_pipeline_not_configured: 'R2 chưa đủ cấu hình để xử lý music upload.',
  unsupported_audio_format: 'Chỉ hỗ trợ MP3, WAV, FLAC, M4A hoặc AAC.',
  audio_file_size_invalid: 'File nhạc rỗng hoặc vượt giới hạn dung lượng server.',
  audio_duration_not_found: 'Không đọc được thời lượng file nhạc.',
}

export async function POST(request: Request) {
  const access = await requireCmsApiAccess('music')
  if (!access.ok) return access.response

  const maxBytes = Math.max(1, Number(process.env.MUSIC_MAX_UPLOAD_MB ?? 1024)) * 1024 * 1024
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > maxBytes + 2 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: 'File upload vượt giới hạn dung lượng được phép.' }, { status: 413 })
  }

  try {
    const formData = await request.formData()
    const audio = formData.get('audio')
    const title = String(formData.get('title') ?? '').trim()
    const type = String(formData.get('type') ?? 'track')
    const accessLevel = String(formData.get('access') ?? 'public')
    const visibility = String(formData.get('visibility') ?? 'draft')

    if (!(audio instanceof File) || !title || !['track', 'nonstop', 'remix'].includes(type) || !['public', 'stars', 'premium', 'internal'].includes(accessLevel) || !['draft', 'pending', 'public', 'hidden'].includes(visibility)) {
      return NextResponse.json({ ok: false, message: 'Thông tin upload chưa hợp lệ.' }, { status: 400 })
    }

    const result = await processMusicUpload({
      title,
      type: type as 'track' | 'nonstop' | 'remix',
      genre: String(formData.get('genre') ?? ''),
      artistSlug: String(formData.get('artistSlug') ?? ''),
      access: accessLevel as 'public' | 'stars' | 'premium' | 'internal',
      displayMap: formData.getAll('displayMap').map((value) => String(value).trim()).filter(Boolean).join(' / '),
      albumLabel: String(formData.get('albumLabel') ?? ''),
      visibility: visibility as 'draft' | 'pending' | 'public' | 'hidden',
      audio,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(':')[0] : ''
    const ffmpegUnavailable = code === 'ffmpeg_unavailable' || code === 'ffprobe_unavailable' || code === 'ffmpeg_failed' || code === 'ffprobe_failed'
    return NextResponse.json(
      { ok: false, message: ffmpegUnavailable ? 'Server chưa cài ffmpeg/ffprobe hoặc không thể xử lý file này.' : messageByError[code] ?? 'Không thể xử lý music upload lúc này.' },
      { status: 500 },
    )
  }
}
