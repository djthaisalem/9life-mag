export type ClubOutlet = {
  slug: string
  name: string
  city: string
  regionId: 'mien-nam' | 'mien-trung' | 'mien-bac'
  regionLabel: 'Miền Nam' | 'Miền Trung' | 'Miền Bắc'
  type: string
  hours: string
  crowd: string
  image: string
  cover: string
  vibe: string
  summary: string
}

export type ClubOutletProfile = {
  introduction: string[]
  highlights: string[]
  tableOptions: string[]
  musicStyles: string[]
  serviceNotes: string[]
  gallery: {
    image: string
    caption: string
  }[]
  faq: {
    question: string
    answer: string
  }[]
  stats: {
    label: string
    value: string
  }[]
}

export const clubOutlets: ClubOutlet[] = [
  {
    slug: 'luxe-district',
    name: 'LUXE District',
    city: 'TP.HCM',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Club / VIP Table',
    hours: '21:00 - 03:00',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    vibe: 'Premium nightlife / VIP table / Headline DJ',
    summary: 'Không gian thiên về crowd cao cấp, line-up mạnh và dịch vụ bàn dành cho group đi đêm.',
  },
  {
    slug: 'saigon-signal',
    name: 'Saigon Signal',
    city: 'TP.HCM',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Lounge / Bottle Service',
    hours: '20:00 - 02:00',
    crowd: '4-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&h=900&fit=crop',
    vibe: 'Lounge energy / stylish crowd / table-first',
    summary: 'Phù hợp các nhóm muốn trải nghiệm bàn riêng, cocktail đẹp và âm nhạc dễ vào mood.',
  },
  {
    slug: 'nexa-beach-club',
    name: 'Nexa Beach Club',
    city: 'Vũng Tàu',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Beach Club / Sunset Party',
    hours: '17:00 - 01:00',
    crowd: '6-14 khách / bàn',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop',
    vibe: 'Sunset crowd / beach table / weekend party',
    summary: 'Bắt đầu với sunset vibe rồi tăng dần năng lượng về đêm, hợp nhóm đi đông và thích không gian mở.',
  },
  {
    slug: 'velour-27',
    name: 'Velour 27',
    city: 'Cần Thơ',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Night Lounge / DJ Night',
    hours: '20:00 - 01:30',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&h=900&fit=crop',
    vibe: 'City lounge / dress-up night / social table',
    summary: 'Không gian hợp nhóm bạn muốn đi đẹp, có bàn riêng và âm nhạc vừa đủ đẩy mood.',
  },
  {
    slug: 'mirage-port',
    name: 'Mirage Port',
    city: 'Phú Quốc',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Beach Lounge / Table Booking',
    hours: '18:00 - 02:00',
    crowd: '6-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
    vibe: 'Island nightlife / bottle table / scenic crowd',
    summary: 'Dành cho khách đi resort, nhóm du lịch hoặc các đêm muốn vừa chill vừa có bàn dịch vụ rõ ràng.',
  },
  {
    slug: 'rouge-signal',
    name: 'Rouge Signal',
    city: 'Biên Hòa',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Club / Weekend Table',
    hours: '20:30 - 02:00',
    crowd: '4-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600&h=900&fit=crop',
    vibe: 'Weekend crowd / local favorite / table-driven',
    summary: 'Mạnh về cuối tuần, nhóm trẻ và trải nghiệm bàn phù hợp các buổi đi đông vừa phải.',
  },
  {
    slug: 'district-9-pulse',
    name: 'District 9 Pulse',
    city: 'TP.HCM',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Club / After Dark',
    hours: '21:30 - 03:00',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=900&fit=crop',
    vibe: 'Late-night energy / DJ peak / urban crowd',
    summary: 'Hợp khung giờ muộn, nhóm thích vào nhịp mạnh và ưu tiên bàn ở gần sân khấu.',
  },
  {
    slug: 'amber-bay',
    name: 'Amber Bay',
    city: 'Mũi Né',
    regionId: 'mien-nam',
    regionLabel: 'Miền Nam',
    type: 'Beach Party / Group Table',
    hours: '17:30 - 00:30',
    crowd: '6-14 khách / bàn',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&h=900&fit=crop',
    vibe: 'Beach party / sunset-to-night / group booking',
    summary: 'Điểm mạnh là không khí tiệc biển và các bàn phù hợp cho nhóm du lịch đông người.',
  },
  {
    slug: 'halo-rooftop',
    name: 'Halo Rooftop',
    city: 'Đà Nẵng',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Rooftop / DJ Night',
    hours: '18:30 - 02:00',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop',
    vibe: 'Open-air / Sunset set / Weekend concept night',
    summary: 'Rooftop có nhịp giải trí trẻ, phù hợp chill trước rồi vào khung giờ peak muộn hơn.',
  },
  {
    slug: 'wave-garden',
    name: 'Wave Garden',
    city: 'Nha Trang',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Open-air Club',
    hours: '20:00 - 02:30',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&h=900&fit=crop',
    vibe: 'Open-air dancefloor / coastal nightlife / group table',
    summary: 'Venue ngoài trời hợp nhóm đi đông, thích âm nhạc nhịp nhanh và không khí du lịch biển.',
  },
  {
    slug: 'afterglow-hue',
    name: 'Afterglow Hue',
    city: 'Huế',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Lounge / Cocktail Music',
    hours: '19:00 - 01:00',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&h=900&fit=crop',
    vibe: 'Cocktail-led / intimate night / stylish crowd',
    summary: 'Phù hợp các buổi đi đêm cần không khí vừa sang vừa nhẹ, ưu tiên bàn nhỏ và mood tinh tế.',
  },
  {
    slug: 'coastline-86',
    name: 'Coastline 86',
    city: 'Quy Nhơn',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Beach Club / Table Zone',
    hours: '18:00 - 01:30',
    crowd: '6-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    vibe: 'Beach table / sunset crowd / social gathering',
    summary: 'Dành cho khách thích bàn ngoài trời, trải nghiệm nhóm và không khí biển rõ rệt.',
  },
  {
    slug: 'marina-gold',
    name: 'Marina Gold',
    city: 'Đà Nẵng',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Sky Lounge / Bottle Service',
    hours: '20:00 - 02:00',
    crowd: '4-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&h=900&fit=crop',
    vibe: 'Sky lounge / polished service / bottle-first',
    summary: 'Phù hợp nhóm khách ưu tiên view, dịch vụ bàn rõ và trải nghiệm premium hơn là dancefloor nặng.',
  },
  {
    slug: 'lotus-afterdark',
    name: 'Lotus Afterdark',
    city: 'Nha Trang',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Night Club / Group Table',
    hours: '21:00 - 03:00',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=900&fit=crop',
    vibe: 'Late-night club / youth crowd / high energy',
    summary: 'Không khí mạnh hơn, phù hợp các đêm muốn vào peak late-night và đặt bàn gần khu DJ.',
  },
  {
    slug: 'moonset-port',
    name: 'Moonset Port',
    city: 'Hội An',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Cocktail Club / Chill Table',
    hours: '19:00 - 00:30',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
    vibe: 'Chill night / cocktail table / traveler crowd',
    summary: 'Phù hợp khách du lịch và nhóm nhỏ muốn trải nghiệm đêm nhẹ, đẹp và có bàn riêng.',
  },
  {
    slug: 'skyline-river',
    name: 'Skyline River',
    city: 'Huế',
    regionId: 'mien-trung',
    regionLabel: 'Miền Trung',
    type: 'Rooftop / Weekend Music',
    hours: '19:30 - 01:30',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&h=900&fit=crop',
    vibe: 'Rooftop vibe / group table / weekend flow',
    summary: 'Cân bằng giữa chill và nhạc đêm, hợp nhóm bạn muốn đi rooftop nhưng vẫn có bàn dịch vụ rõ.',
  },
  {
    slug: 'velvet-room',
    name: 'Velvet Room',
    city: 'Hà Nội',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Luxury Lounge / Table Booking',
    hours: '20:30 - 02:30',
    crowd: '4-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&h=900&fit=crop',
    vibe: 'Luxury lounge / Bottle service / Dress-up night',
    summary: 'Điểm đến mạnh về bàn VIP, trải nghiệm nhóm và các đêm có host hoặc nghệ sĩ khách mời.',
  },
  {
    slug: 'north-pulse',
    name: 'North Pulse',
    city: 'Hà Nội',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Club / Weekend Headliner',
    hours: '21:00 - 03:00',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    vibe: 'Headline night / urban crowd / strong DJ focus',
    summary: 'Mạnh về các đêm cuối tuần có line-up lớn, hợp nhóm muốn vào đúng khung giờ peak.',
  },
  {
    slug: 'skyline-88',
    name: 'Skyline 88',
    city: 'Hải Phòng',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Sky Bar / Group Table',
    hours: '19:00 - 01:30',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop',
    vibe: 'Sky bar / city view / group booking',
    summary: 'Nhấn mạnh view và trải nghiệm bàn nhóm, phù hợp các tối cần không gian mở nhưng vẫn có nhạc.',
  },
  {
    slug: 'ivory-noir',
    name: 'Ivory Noir',
    city: 'Hạ Long',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Lounge / Bottle Service',
    hours: '20:00 - 02:00',
    crowd: '4-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&h=900&fit=crop',
    vibe: 'Bottle service / premium mood / polished night',
    summary: 'Hợp khách thích dịch vụ bàn rõ ràng, decor đẹp và không khí ăn mặc chỉn chu hơn.',
  },
  {
    slug: 'metro-11',
    name: 'Metro 11',
    city: 'Hà Nội',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Club / Prime Night',
    hours: '21:30 - 03:00',
    crowd: '6-12 khách / bàn',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&h=900&fit=crop',
    vibe: 'Prime-night club / peak crowd / urban table',
    summary: 'Phù hợp các nhóm muốn đi mạnh về âm nhạc và đặt bàn ở khu có năng lượng cao.',
  },
  {
    slug: 'polar-beat',
    name: 'Polar Beat',
    city: 'Hải Phòng',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Night Lounge / DJ Set',
    hours: '20:00 - 02:00',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600&h=900&fit=crop',
    vibe: 'Night lounge / stylish crowd / DJ-led table',
    summary: 'Không khí vừa phải, hợp nhóm muốn có bàn riêng nhưng không quá nặng về club peak.',
  },
  {
    slug: 'moon-velvet',
    name: 'Moon Velvet',
    city: 'Nam Định',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Cocktail Club / Table Night',
    hours: '19:30 - 01:00',
    crowd: '4-8 khách / bàn',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
    vibe: 'Cocktail night / intimate table / social mood',
    summary: 'Dành cho nhóm thích trải nghiệm đêm tinh tế hơn, tập trung vào bàn và không khí trò chuyện.',
  },
  {
    slug: 'crown-district',
    name: 'Crown District',
    city: 'Quảng Ninh',
    regionId: 'mien-bac',
    regionLabel: 'Miền Bắc',
    type: 'Club / VIP Table',
    hours: '21:00 - 02:30',
    crowd: '6-10 khách / bàn',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=900&fit=crop',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&h=900&fit=crop',
    vibe: 'VIP zone / strong nightlife / group service',
    summary: 'Hợp nhóm đi đông, cần bàn service rõ và thích không khí náo nhiệt hơn về đêm.',
  },
]

export const featuredClubs = [
  clubOutlets[0],
  clubOutlets[8],
  clubOutlets[16],
] as const

export const regionalOutlets = [
  {
    id: 'mien-nam',
    label: 'Miền Nam',
    outlets: clubOutlets.filter((outlet) => outlet.regionId === 'mien-nam'),
  },
  {
    id: 'mien-trung',
    label: 'Miền Trung',
    outlets: clubOutlets.filter((outlet) => outlet.regionId === 'mien-trung'),
  },
  {
    id: 'mien-bac',
    label: 'Miền Bắc',
    outlets: clubOutlets.filter((outlet) => outlet.regionId === 'mien-bac'),
  },
] as const

const profileOverrides: Partial<Record<string, Partial<ClubOutletProfile>>> = {
  'luxe-district': {
    introduction: [
      'LUXE District là outlet định vị theo hướng premium nightlife, phù hợp nhóm khách muốn đi bàn riêng, có không gian đẹp, âm nhạc mạnh và dịch vụ rõ ràng ngay từ lúc check-in.',
      'Venue này nổi bật ở cách vận hành trải nghiệm bàn: khoảng cách giữa khu ngồi và khu DJ vừa đủ để giữ năng lượng nhưng vẫn còn sự riêng tư cho nhóm khách đi theo bàn.',
      'Những đêm mạnh nhất của LUXE District thường nằm ở khung giờ peak cuối tuần, khi venue kết hợp headline DJ, visual đồng bộ và bottle service theo nhóm.'
    ],
  },
  'halo-rooftop': {
    introduction: [
      'Halo Rooftop là lựa chọn hợp với nhóm thích đi night life theo nhịp đẹp mắt hơn là quá nặng club peak ngay từ đầu. Venue mở đầu bằng sunset và tăng dần mood về tối.',
      'Điểm mạnh nằm ở view, không gian mở và khả năng tạo cảm giác vừa chill vừa có điểm rơi âm nhạc khi đêm muộn hơn.',
      'Với khách đặt bàn, Halo Rooftop phù hợp những buổi hẹn nhóm, birthday table hoặc trải nghiệm rooftop cuối tuần có DJ set rõ nét.'
    ],
  },
  'velvet-room': {
    introduction: [
      'Velvet Room được định vị như một luxury lounge dành cho khách ưu tiên trải nghiệm bàn, bottle service và không khí dress-up night rõ rệt.',
      'Không gian phù hợp với nhóm muốn đi bài bản hơn: vào venue đẹp, chọn đúng khu bàn, có host hoặc guest performance để giữ cảm giác premium suốt đêm.',
      'Đây là dạng outlet mạnh ở nhu cầu đặt bàn sớm, đặc biệt vào cuối tuần hoặc các đêm có line-up khách mời.'
    ],
  },
}

export function getOutletBySlug(slug: string) {
  return clubOutlets.find((outlet) => outlet.slug === slug)
}

export function getOutletProfile(outlet: ClubOutlet): ClubOutletProfile {
  const defaults: ClubOutletProfile = {
    introduction: [
      `${outlet.name} tại ${outlet.city} là outlet theo hướng ${outlet.type.toLowerCase()}, phù hợp với nhóm khách muốn đặt bàn, đi theo hội và chủ động chọn trải nghiệm nightlife theo đúng mood của đêm.`,
      `Điểm nổi bật của outlet này nằm ở vibe ${outlet.vibe.toLowerCase()}, thời gian hoạt động ${outlet.hours} và quy mô bàn phù hợp ${outlet.crowd.toLowerCase()}.`,
      'Profile outlet này được thiết kế như một trang giới thiệu venue chuyên nghiệp để khách nhìn nhanh là hiểu được không khí, kiểu bàn, mức độ phù hợp và giá trị trải nghiệm của địa điểm.'
    ],
    highlights: [
      'Bàn nhóm rõ phân khu, dễ chọn theo mood và quy mô khách',
      'Âm nhạc và visual phù hợp trải nghiệm nightlife hiện đại',
      'Phù hợp birthday table, group booking và weekend night out'
    ],
    tableOptions: ['Standard table', 'VIP sofa table', 'Birthday package', 'Bottle service table'],
    musicStyles: ['House / Open format', 'EDM peak hour', 'Hip-hop crossover', 'Late-night remix'],
    serviceNotes: [
      `Khung giờ hoạt động: ${outlet.hours}`,
      `Quy mô nhóm phù hợp: ${outlet.crowd}`,
      `Khu vực: ${outlet.city} / ${outlet.regionLabel}`,
    ],
    gallery: [
      { image: outlet.cover, caption: `${outlet.name} venue atmosphere` },
      { image: outlet.image, caption: `${outlet.name} table zone` },
      { image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=900&fit=crop', caption: 'Bottle service and lighting mood' },
      { image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop', caption: 'Weekend crowd energy' },
    ],
    faq: [
      {
        question: 'Outlet này hợp với nhóm khách nào?',
        answer: 'Phù hợp nhóm bạn, birthday table, khách nightlife muốn có bàn riêng và chọn rõ khu vực theo vibe của đêm.'
      },
      {
        question: 'Có thể dùng profile này cho booking thật sau này không?',
        answer: 'Có. Cấu trúc này đang được làm sẵn theo kiểu profile venue để sau này có thể nối CMS, thêm media thật, giá bàn, layout khu bàn và lịch sự kiện.'
      }
    ],
    stats: [
      { label: 'Khu vực', value: outlet.city },
      { label: 'Giờ hoạt động', value: outlet.hours },
      { label: 'Quy mô bàn', value: outlet.crowd },
      { label: 'Định vị', value: outlet.type },
    ],
  }

  return {
    ...defaults,
    ...profileOverrides[outlet.slug],
  }
}
