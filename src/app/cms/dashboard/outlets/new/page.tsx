import Link from 'next/link'

import { CmsOutletProfileBuilder, type OutletEditorInitial, type OutletMedia } from '@/components/cms-outlet-profile-builder'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { loadPayloadClient } from '@/lib/payload-runtime'

function mediaFrom(value: unknown): OutletMedia | null {
  if (!value || typeof value !== 'object') return null
  const media = value as { id?: string | number; url?: string; alt?: string }
  if (!media.id) return null
  return { id: String(media.id), url: `/api/public/media/${media.id}`, alt: media.alt || 'Ảnh outlet' }
}

async function getInitial(id?: string): Promise<OutletEditorInitial | undefined> {
  const outletId = Number(id)
  if (!Number.isSafeInteger(outletId) || outletId <= 0) return undefined
  try {
    const payload = await loadPayloadClient()
    const outlet = await payload.findByID({ collection: 'outlet-profiles', id: outletId, depth: 1, overrideAccess: true })
    return {
      id: String(outlet.id), name: outlet.name, status: outlet.status as OutletEditorInitial['status'], type: outlet.type || '', region: outlet.region || '', city: outlet.city || '', hours: outlet.hours || '', crowd: outlet.crowd || '', vibe: outlet.vibe || '', summary: outlet.summary || '', introduction: outlet.introduction || '', highlights: outlet.highlights || '', tableOptions: outlet.tableOptions || '', serviceNotes: outlet.serviceNotes || '', musicStyles: outlet.musicStyles || '', faq: outlet.faq || '', videoEmbed: outlet.videoEmbed || '', audioEmbed: outlet.audioEmbed || '', bookingChannel: outlet.bookingChannel || '', coverImage: mediaFrom(outlet.coverImage), portraitImage: mediaFrom(outlet.portraitImage), gallery: Array.isArray(outlet.gallery) ? outlet.gallery.map(mediaFrom).filter((media): media is OutletMedia => Boolean(media)) : [],
    }
  } catch {
    return undefined
  }
}

export default async function CmsOutletCreatePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const initial = await getInitial((await searchParams).id)
  return (
    <CmsDashboardShell activeKey="outlets" title={initial ? 'Chỉnh sửa Profile Outlet' : 'Tạo Profile Outlet'} description="Khởi tạo, lưu nháp và hoàn thiện profile outlet với media thật trên R2.">
      <article className="panel"><div className="cms-panel-head-inline cms-panel-head-inline-stretch"><div><p className="section-eyebrow">Outlet Profile</p><h2>{initial ? initial.name : 'Tạo profile outlet mới'}</h2></div><Link href="/cms/dashboard/outlets" className="button-secondary">Quay lại outlets</Link></div></article>
      <CmsOutletProfileBuilder initial={initial} />
    </CmsDashboardShell>
  )
}
