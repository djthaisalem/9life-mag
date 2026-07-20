import type { ArtistProfile } from '@/lib/artist-directory-data'

export const INDEPENDENT_ARTIST_AGENT = 'Independent Artist'

export type ArtistAgencyProfile = {
  name: string
  slug: string
  label: string
  location: string
  coverage: string
  image: string
  description: string
  specialties: string[]
  services: string[]
}

const artistAgencyMap: Record<string, string> = {
  'neon-viper': '9Life Artist Ops',
  'luna-flux': 'LUXE Booking Desk',
  'mc-blaze': INDEPENDENT_ARTIST_AGENT,
  'velvet-queen': 'Velvet Host Agency',
  'k-phantom': 'Street Circuit',
  'nova-fire': 'North Wave Talent',
  'echo-violet': 'Aurora Artist House',
  'ghost-frequency': 'Afterhours Lab',
  'sora-vee': 'Campus Event Network',
  'rex-nova': INDEPENDENT_ARTIST_AGENT,
  'aria-rush': 'Stage Motion Crew',
  'kai-motion': 'Stage Motion Crew',
}

const agencyProfiles: ArtistAgencyProfile[] = [
  { name: '9Life Artist Ops', slug: '9life-artist-ops', label: 'Artist Management', location: 'TP.HCM', coverage: 'Việt Nam & khu vực', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&h=800&fit=crop', description: 'Đơn vị quản lý nghệ sĩ tập trung vào chiến lược hình ảnh, booking và phát hành âm nhạc trong hệ sinh thái nightlife.', specialties: ['Artist strategy', 'Booking direction', 'Release operations'], services: ['Quản lý lịch diễn', 'Điều phối booking', 'Phát triển media kit', 'Kết nối brand partnership'] },
  { name: 'LUXE Booking Desk', slug: 'luxe-booking-desk', label: 'Premium Booking Agency', location: 'Hà Nội', coverage: 'Hà Nội, Hạ Long & miền Bắc', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&h=800&fit=crop', description: 'Booking desk dành cho các format lounge, club cao cấp và private event cần tiêu chuẩn vận hành chỉn chu.', specialties: ['Premium nightlife', 'VIP events', 'Venue matching'], services: ['Booking negotiation', 'Venue coordination', 'Hospitality planning', 'Show-day support'] },
  { name: 'Velvet Host Agency', slug: 'velvet-host-agency', label: 'Host & Event Representation', location: 'TP.HCM', coverage: 'Miền Nam & điểm đến du lịch', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1400&h=800&fit=crop', description: 'Agency đại diện cho host và talent có định vị premium, phù hợp với venue, brand dinner và sự kiện trải nghiệm.', specialties: ['Luxury hosting', 'Brand showcases', 'VIP guest experience'], services: ['Talent representation', 'Event hosting', 'Brand presentation', 'Campaign casting'] },
  { name: 'Street Circuit', slug: 'street-circuit', label: 'Hip-hop & Urban Talent', location: 'Cần Thơ', coverage: 'Miền Tây & TP.HCM', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&h=800&fit=crop', description: 'Collective quản lý talent urban, rap và performance có kết nối mạnh với cộng đồng trẻ và sân khấu live.', specialties: ['Urban culture', 'Live showcase', 'Youth community'], services: ['Showcase booking', 'Tour routing', 'Brand collaboration', 'Community activation'] },
  { name: 'North Wave Talent', slug: 'north-wave-talent', label: 'Artist Representation', location: 'Hà Nội', coverage: 'Miền Bắc & toàn quốc', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1400&h=800&fit=crop', description: 'Đại diện nghệ sĩ theo định hướng sân khấu, truyền thông và hợp tác thương hiệu dành cho các format hiện đại.', specialties: ['Performance direction', 'Brand collaboration', 'Media relations'], services: ['Artist booking', 'Show planning', 'Press coordination', 'Campaign consulting'] },
  { name: 'Aurora Artist House', slug: 'aurora-artist-house', label: 'Music & Creative Management', location: 'Nha Trang', coverage: 'Nha Trang, TP.HCM & Hà Nội', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&h=800&fit=crop', description: 'Creative house dành cho producer, live set và các dự án âm nhạc kết hợp visual storytelling.', specialties: ['Music releases', 'Creative direction', 'Live set production'], services: ['Release planning', 'Creative production', 'Music distribution', 'Visual coordination'] },
  { name: 'Afterhours Lab', slug: 'afterhours-lab', label: 'Electronic Music Collective', location: 'Đà Lạt', coverage: 'Đà Lạt, TP.HCM & điểm đến concept', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&h=800&fit=crop', description: 'Collective dành cho electronic, techno và concept night có yêu cầu cao về curator, trải nghiệm và cộng đồng.', specialties: ['Electronic curation', 'Concept nights', 'Afterhours'], services: ['Artist curation', 'Venue programming', 'Concept development', 'Community partnerships'] },
  { name: 'Campus Event Network', slug: 'campus-event-network', label: 'Campus & Youth Events', location: 'Biên Hòa', coverage: 'Đông Nam Bộ & campus tour', image: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=1400&h=800&fit=crop', description: 'Network điều phối talent cho campus event, festival cộng đồng và activation hướng đến khán giả trẻ.', specialties: ['Campus events', 'Youth activation', 'Festival warm-up'], services: ['Campus booking', 'Event production', 'Sponsor activation', 'Regional routing'] },
  { name: 'Stage Motion Crew', slug: 'stage-motion-crew', label: 'Performance & Choreography Management', location: 'TP.HCM', coverage: 'Toàn quốc', image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1400&h=800&fit=crop', description: 'Đơn vị quản lý dancer và performance talent cho nightlife show, commercial stage và choreography concept.', specialties: ['Dance performance', 'Stage choreography', 'Visual activation'], services: ['Talent booking', 'Choreography direction', 'Stage staffing', 'Visual performance design'] },
]

export function getArtistAgentName(artistSlug: string, assignedAgent?: string) {
  return assignedAgent?.trim() || artistAgencyMap[artistSlug] || INDEPENDENT_ARTIST_AGENT
}

export function getArtistAgency(agentName: string) {
  return agencyProfiles.find((agency) => agency.name === agentName)
}

export function getArtistAgencyBySlug(slug: string) {
  return agencyProfiles.find((agency) => agency.slug === slug)
}

export function getArtistsForAgency(artists: ArtistProfile[], agentName: string, assignments: Record<string, string> = {}) {
  return artists.filter((artist) => getArtistAgentName(artist.slug, assignments[artist.slug]) === agentName)
}

export function getArtistAgencyChoices() {
  return agencyProfiles.map((agency) => agency.name)
}

export function getArtistAgencies() {
  return agencyProfiles
}
