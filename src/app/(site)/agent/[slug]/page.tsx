import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarCheck2, MapPin, Sparkles, Users2 } from 'lucide-react'
import { artistProfiles } from '@/lib/artist-directory-data'
import { getArtistsForAgency } from '@/lib/artist-agency-data'
import { getStoredArtistAgency } from '@/lib/artist-agency-store'
import { getArtistAgentAssignments } from '@/lib/site-user-session'
import { createShareMetadata } from '@/lib/seo'
import { AgentProfileActions } from '@/components/agent-profile-actions'
import { StudentApplicationButton } from '@/components/student-application-button'
import { getStudentRegistrationEnabled } from '@/lib/student-registration-settings'

type AgentProfilePageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: AgentProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const agency = await getStoredArtistAgency(slug)
  if (!agency) return {}
  return createShareMetadata({ title: `${agency.name} | ${agency.label}`, description: agency.description, path: `/agent/${agency.slug}`, image: agency.image })
}

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { slug } = await params
  const agency = await getStoredArtistAgency(slug)
  if (!agency) notFound()

  const assignments = await getArtistAgentAssignments()
  const assignmentMap = Object.fromEntries(assignments.filter((item) => item.artistProfileSlug).map((item) => [item.artistProfileSlug as string, item.artistAgent ?? '']))
  const roster = getArtistsForAgency(artistProfiles, agency.name, assignmentMap)
  const studentRegistrationEnabled = await getStudentRegistrationEnabled('agent', agency.slug)

  return <main className="agent-profile-page"><section className="agent-profile-hero"><img src={agency.image} alt={agency.name} /><div className="agent-profile-hero-overlay" /><div className="container agent-profile-hero-inner"><Link href="/nghe-si" className="agent-profile-back"><ArrowLeft size={16} /> Danh mục nghệ sĩ</Link><p className="section-eyebrow">{agency.label}</p><h1>{agency.name}</h1><p>{agency.description}</p><div className="agent-profile-hero-meta"><span><MapPin size={16} /> {agency.location}</span><span><Users2 size={16} /> {roster.length} nghệ sĩ đang quản lý</span><span><BadgeCheck size={16} /> {agency.coverage}</span></div><AgentProfileActions agentName={agency.name} agentSlug={agency.slug} /></div></section>
    <section className="section"><div className="container agent-profile-layout"><div className="agent-profile-main"><article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Management Focus</p><h2>Định hướng quản lý</h2></div><BriefcaseBusiness size={20} /></div><div className="agent-focus-grid">{agency.specialties.map((specialty) => <div key={specialty}><Sparkles size={16} /><strong>{specialty}</strong></div>)}</div></article><article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Artist Roster</p><h2>Nghệ sĩ thuộc quyền quản lý</h2><p className="artist-editor-panel-note">Danh sách được đồng bộ theo mapping Agent trong hệ thống.</p></div></div>{roster.length ? <div className="agent-roster-grid">{roster.map((artist) => <article key={artist.slug} className="agent-roster-card"><Link href={`/nghe-si/${artist.slug}`}><img src={artist.image} alt={artist.name} /></Link><div><span>{artist.role}</span><h3>{artist.name}</h3><p>{artist.genres}</p><div className="agent-roster-actions"><Link href={`/nghe-si/${artist.slug}`} className="mini-button">Xem profile</Link><Link href={`/booking?artist=${artist.slug}`} className="mini-button mini-button-alt"><CalendarCheck2 size={14} /> Booking</Link></div></div></article>)}</div> : <p className="muted">Agent này chưa có nghệ sĩ được map trong hệ thống.</p>}</article></div><aside className="agent-profile-side"><article className="artist-panel"><div className="artist-panel-head"><div><p className="section-eyebrow">Services</p><h2>Dịch vụ</h2></div></div><div className="artist-value-list">{agency.services.map((service) => <div key={service} className="artist-value-card"><BadgeCheck size={18} /><div><strong>{service}</strong><span>Được điều phối theo profile, booking và kế hoạch của từng nghệ sĩ.</span></div></div>)}</div></article><article className="artist-panel agent-profile-contact"><p className="section-eyebrow">Booking & Partnership</p><h2>Cần làm việc với Agent?</h2><p>Gửi yêu cầu booking hoặc hợp tác, đội ngũ phù hợp sẽ tiếp nhận và phản hồi theo thông tin hồ sơ.</p><Link href="/booking" className="button">Gửi booking</Link></article>{studentRegistrationEnabled ? <article className="artist-panel student-application-profile-card"><p className="section-eyebrow">Mentorship</p><h2>Đăng ký học viên</h2><p>Gửi thông tin học tập trực tiếp đến {agency.name}. Agent sẽ xem xét và liên hệ lại nếu phù hợp.</p><StudentApplicationButton targetType="agent" targetSlug={agency.slug} targetName={agency.name} /></article> : null}</aside></div></section></main>
}
