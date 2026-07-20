import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getArtistPortalApiAccess } from '@/lib/artist-portal-access'
import { getArtistPrivateContact, saveArtistPrivateContact } from '@/lib/artist-private-contact'

const contactSchema = z.object({ email: z.string().email().or(z.literal('')), phone: z.string().max(40), facebook: z.string().url().or(z.literal('')), telegram: z.string().max(160), zalo: z.string().max(160), tiktok: z.string().url().or(z.literal('')) })

async function getArtistSlug() {
  const account = await getArtistPortalApiAccess('artist')
  return account?.artistProfileSlug?.trim() || null
}

export async function GET() {
  const artistSlug = await getArtistSlug()
  if (!artistSlug) return NextResponse.json({ ok: false, message: 'Bạn chưa được map với hồ sơ nghệ sĩ.' }, { status: 403 })
  return NextResponse.json({ ok: true, contact: await getArtistPrivateContact(artistSlug) })
}

export async function POST(request: Request) {
  const artistSlug = await getArtistSlug()
  if (!artistSlug) return NextResponse.json({ ok: false, message: 'Bạn chưa được map với hồ sơ nghệ sĩ.' }, { status: 403 })
  try { return NextResponse.json({ ok: true, contact: await saveArtistPrivateContact(artistSlug, contactSchema.parse(await request.json())) }) }
  catch { return NextResponse.json({ ok: false, message: 'Vui lòng kiểm tra định dạng email và đường dẫn mạng xã hội.' }, { status: 400 }) }
}
