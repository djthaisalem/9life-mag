import { repairVietnameseValue } from '@/lib/repair-vietnamese-text'

export type ArtistFilter = 'all' | 'dj' | 'mc' | 'rapper' | 'dancer' | 'photographer' | 'model' | 'designer' | 'female' | 'male'

export type ArtistProfile = {
  id: number
  slug: string
  name: string
  category: 'dj' | 'mc' | 'rapper' | 'dancer' | 'photographer' | 'model' | 'designer'
  gender: 'female' | 'male'
  role: string
  genres: string
  location: string
  availability: string
  rate: string
  followers: string
  image: string
  cover: string
  bio: string
  highlights: string[]
  performanceModes: string[]
  cities: string[]
  socialProof: {
    monthlyReach: string
    eventsDone: string
    brandTone: string
  }
}

export type ArtistRichContent = {
  introduction: string[]
  workExperience: string[]
  signatureMoments: string[]
  gallery: {
    image: string
    caption: string
  }[]
  videos: {
    title: string
    platform: 'YouTube' | 'Facebook'
    embedUrl: string
    href: string
  }[]
  audio: {
    title: string
    subtitle: string
    embedUrl: string
  }[]
  socials: {
    label: string
    href: string
  }[]
  bookingNotes: string[]
  rider: string[]
  faq: {
    question: string
    answer: string
  }[]
}

export const artistFilterTabs: { label: string; value: ArtistFilter }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'DJ', value: 'dj' },
  { label: 'MC Hype', value: 'mc' },
  { label: 'Rapper', value: 'rapper' },
  { label: 'Dancer', value: 'dancer' },
  { label: 'Model', value: 'model' },
  { label: 'Designer', value: 'designer' },
  { label: 'Nữ', value: 'female' },
  { label: 'Nam', value: 'male' }
]

const photographerProfile: ArtistProfile = {
  id: 13,
  slug: 'noir-frame',
  name: 'Noir Frame',
  category: 'photographer',
  gender: 'male',
  role: 'Nightlife Photographer',
  genres: 'Club Visual / Event Recap / Artist Portrait',
  location: 'TP.HCM',
  availability: 'Available for weekend events',
  rate: 'Liên hệ để biết thêm chi tiết',
  followers: '42K followers',
  image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=1100&fit=crop',
  cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
  bio: 'Noir Frame chuyên chụp nightlife, sân khấu và chân dung nghệ sĩ với phong cách tương phản mạnh, giàu năng lượng.',
  highlights: ['Nightlife event coverage', 'Artist portrait direction', 'Same-night social delivery'],
  performanceModes: ['Club residency', 'Event recap', 'Artist campaign'],
  cities: ['TP.HCM', 'Hà Nội', 'Đà Nẵng'],
  socialProof: { monthlyReach: '320K reach / tháng', eventsDone: '96 event / năm', brandTone: 'Cinematic / energetic / editorial' },
}

const modelProfile: ArtistProfile = {
  id: 14,
  slug: 'mira-noir',
  name: 'Mira Noir',
  category: 'model',
  gender: 'female',
  role: 'Nightlife Model / Brand Host',
  genres: 'Luxury Lounge / Fashion Event / Brand Activation',
  location: 'TP.HCM',
  availability: 'Available for premium events',
  rate: 'Liên hệ để biết thêm chi tiết',
  followers: '68K followers',
  image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop',
  cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
  bio: 'Mira Noir là model nightlife theo định hướng luxury visual, phù hợp với club premium, fashion event, brand activation và các chiến dịch cần hình ảnh chỉn chu.',
  highlights: ['Luxury venue presence', 'Brand activation ready', 'Editorial and campaign friendly'],
  performanceModes: ['VIP lounge', 'Fashion event', 'Brand activation'],
  cities: ['TP.HCM', 'Hà Nội', 'Đà Nẵng'],
  socialProof: { monthlyReach: '740K reach / tháng', eventsDone: '48 event / năm', brandTone: 'Luxury / confident / editorial' },
}

const designerProfile: ArtistProfile = {
  id: 15,
  slug: 'aster-kline',
  name: 'Aster Kline',
  category: 'designer',
  gender: 'female',
  role: 'Nightlife Visual Designer / Creative Director',
  genres: 'Club Identity / LED Visual / Event Art Direction',
  location: 'TP.HCM',
  availability: 'Available for creative collaborations',
  rate: 'Liên hệ để biết thêm chi tiết',
  followers: '51K followers',
  image: 'https://images.unsplash.com/photo-1542596594-649edbc13630?w=900&h=1100&fit=crop',
  cover: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&h=900&fit=crop',
  bio: 'Aster Kline là visual designer và creative director cho nightlife, xây dựng nhận diện, LED visual và trải nghiệm hình ảnh đồng bộ cho club, event và chiến dịch thương hiệu.',
  highlights: ['Nightlife visual identity', 'LED content direction', 'Event art direction'],
  performanceModes: ['Club rebrand', 'Event visual package', 'Brand activation'],
  cities: ['TP.HCM', 'Hà Nội', 'Đà Nẵng'],
  socialProof: { monthlyReach: '460K reach / tháng', eventsDone: '38 campaign / năm', brandTone: 'Bold / digital / immersive' },
}

export const artistProfiles: ArtistProfile[] = [
  {
    id: 1,
    slug: 'neon-viper',
    name: 'Neon Viper',
    category: 'dj',
    gender: 'male',
    role: 'DJ Headliner',
    genres: 'EDM / Future Rave / Festival Set',
    location: 'TP.HCM',
    availability: 'Available this weekend',
    rate: 'Từ 25.000.000 VND',
    followers: '128K followers',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&h=900&fit=crop',
    bio: 'Neon Viper là DJ headliner theo đuổi dòng festival EDM và future rave, nổi bật với set giàu năng lượng, visual mạnh và khả năng giữ crowd xuyên suốt prime time.',
    highlights: ['Prime-time festival set', 'Visual sync ready', 'Strong nightlife crowd control'],
    performanceModes: ['Club residency', 'Festival headline', 'Brand launch'],
    cities: ['TP.HCM', 'Hà Nội', 'Đà Nẵng'],
    socialProof: {
      monthlyReach: '1.2M reach / tháng',
      eventsDone: '84 đêm diễn / năm',
      brandTone: 'High-energy / premium / headline'
    }
  },
  {
    id: 2,
    slug: 'luna-flux',
    name: 'Luna Flux',
    category: 'dj',
    gender: 'female',
    role: 'Open Format DJ',
    genres: 'House / Afro Beat / Club Pop',
    location: 'Hà Nội',
    availability: 'Prime time booking',
    rate: 'Từ 18.000.000 VND',
    followers: '96K followers',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&h=900&fit=crop',
    bio: 'Luna Flux theo đuổi open format hiện đại, chuyển nhịp mượt giữa house, afro beat và club pop, phù hợp với venue cần một set vừa sang vừa giữ dancefloor.',
    highlights: ['Open format linh hoạt', 'Female nightlife appeal', 'Luxury lounge friendly'],
    performanceModes: ['Luxury club', 'VIP lounge', 'Private event'],
    cities: ['Hà Nội', 'Hạ Long', 'Nha Trang'],
    socialProof: {
      monthlyReach: '860K reach / tháng',
      eventsDone: '61 đêm diễn / năm',
      brandTone: 'Elegant / modern / crowd-friendly'
    }
  },
  {
    id: 3,
    slug: 'mc-blaze',
    name: 'MC Blaze',
    category: 'mc',
    gender: 'male',
    role: 'MC / Hype Host',
    genres: 'Club Hosting / Event Activation',
    location: 'Đà Nẵng',
    availability: 'Late night events',
    rate: 'Từ 12.000.000 VND',
    followers: '74K followers',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    bio: 'MC Blaze chuyên tạo không khí cho club night, activation và sân khấu giải trí, với phong cách dẫn dắt mạnh nhịp, dễ tương tác với crowd trẻ.',
    highlights: ['Crowd activation mạnh', 'Club mic control', 'Sponsor shoutout tốt'],
    performanceModes: ['Club hosting', 'Campus event', 'Brand activation'],
    cities: ['Đà Nẵng', 'Huế', 'Quy Nhơn'],
    socialProof: {
      monthlyReach: '540K reach / tháng',
      eventsDone: '90 phiên host / năm',
      brandTone: 'Loud / hype / youth-driven'
    }
  },
  {
    id: 4,
    slug: 'velvet-queen',
    name: 'Velvet Queen',
    category: 'mc',
    gender: 'female',
    role: 'MC / Luxury Host',
    genres: 'Premium Club / Brand Showcase',
    location: 'TP.HCM',
    availability: 'Available for VIP lounge',
    rate: 'Từ 15.000.000 VND',
    followers: '82K followers',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1600&h=900&fit=crop',
    bio: 'Velvet Queen là lựa chọn hợp cho các đêm lounge, opening và VIP experience cần một host sang trọng, nói chuyện khéo và giữ nhịp tốt trên sân khấu.',
    highlights: ['Luxury tone', 'Brand-friendly image', 'VIP guest interaction'],
    performanceModes: ['VIP event', 'Luxury club', 'Brand dinner'],
    cities: ['TP.HCM', 'Phú Quốc', 'Vũng Tàu'],
    socialProof: {
      monthlyReach: '620K reach / tháng',
      eventsDone: '52 phiên host / năm',
      brandTone: 'Elegant / premium / polished'
    }
  },
  {
    id: 5,
    slug: 'k-phantom',
    name: 'K-Phantom',
    category: 'rapper',
    gender: 'male',
    role: 'Rapper / Live Performer',
    genres: 'Trap / Drill / Club Rap',
    location: 'Cần Thơ',
    availability: 'Festival ready',
    rate: 'Từ 20.000.000 VND',
    followers: '110K followers',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&h=900&fit=crop',
    bio: 'K-Phantom là rapper biểu diễn thiên về trap và club rap, có khả năng đẩy nhiệt sân khấu nhanh, hợp showcase, college tour và line-up crossover.',
    highlights: ['Live rap mạnh', 'High energy showcase', 'Youth audience fit'],
    performanceModes: ['Festival', 'College tour', 'Club special set'],
    cities: ['Cần Thơ', 'TP.HCM', 'An Giang'],
    socialProof: {
      monthlyReach: '980K reach / tháng',
      eventsDone: '68 show / năm',
      brandTone: 'Raw / current / youth culture'
    }
  },
  {
    id: 6,
    slug: 'nova-fire',
    name: 'Nova Fire',
    category: 'rapper',
    gender: 'female',
    role: 'Rapper / Performance Artist',
    genres: 'Hip-hop / Bass / Crossover',
    location: 'Hà Nội',
    availability: 'Available for college tour',
    rate: 'Từ 17.000.000 VND',
    followers: '89K followers',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&h=900&fit=crop',
    bio: 'Nova Fire có hình ảnh performance mạnh, phù hợp các chương trình hip-hop, bass event và những sân khấu cần một nữ rapper có tính hiện đại và visual tốt.',
    highlights: ['Female rap appeal', 'Stage visual strong', 'Crossover performance'],
    performanceModes: ['Hip-hop stage', 'Brand collab', 'Campus concert'],
    cities: ['Hà Nội', 'Hải Phòng', 'Nam Định'],
    socialProof: {
      monthlyReach: '710K reach / tháng',
      eventsDone: '47 show / năm',
      brandTone: 'Bold / visual / crossover'
    }
  },
  {
    id: 7,
    slug: 'echo-violet',
    name: 'Echo Violet',
    category: 'dj',
    gender: 'female',
    role: 'Producer / Live Set',
    genres: 'Future Bass / Pop EDM / Visual Set',
    location: 'Nha Trang',
    availability: 'Touring next month',
    rate: 'Từ 22.000.000 VND',
    followers: '101K followers',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1600&h=900&fit=crop',
    bio: 'Echo Violet kết hợp producer mindset với live performance, phù hợp các đêm diễn cần âm nhạc điện tử giàu cảm xúc nhưng vẫn pop-friendly.',
    highlights: ['Producer-led live set', 'Visual storytelling', 'Pop crossover'],
    performanceModes: ['Live set', 'Festival', 'Brand launch'],
    cities: ['Nha Trang', 'TP.HCM', 'Hà Nội'],
    socialProof: {
      monthlyReach: '890K reach / tháng',
      eventsDone: '56 show / năm',
      brandTone: 'Emotional / future / premium'
    }
  },
  {
    id: 8,
    slug: 'ghost-frequency',
    name: 'Ghost Frequency',
    category: 'dj',
    gender: 'male',
    role: 'Producer / Sound Architect',
    genres: 'Techno / Progressive / Afterhours',
    location: 'Đà Lạt',
    availability: 'Private event specialist',
    rate: 'Từ 19.000.000 VND',
    followers: '77K followers',
    image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&h=900&fit=crop',
    bio: 'Ghost Frequency dành cho crowd yêu progressive, techno và afterhours. Phù hợp các venue cần một set sâu, trưởng thành và có màu âm nhạc rõ nét.',
    highlights: ['Afterhours specialist', 'Deep progressive flow', 'Private event tone'],
    performanceModes: ['Afterhours', 'Private event', 'Concept night'],
    cities: ['Đà Lạt', 'TP.HCM', 'Phan Thiết'],
    socialProof: {
      monthlyReach: '560K reach / tháng',
      eventsDone: '49 set / năm',
      brandTone: 'Deep / mature / curated'
    }
  },
  {
    id: 9,
    slug: 'sora-vee',
    name: 'Sora Vee',
    category: 'mc',
    gender: 'female',
    role: 'MC / Stage Host',
    genres: 'Festival / Campus / Club Night',
    location: 'Biên Hòa',
    availability: 'Weekend bookings open',
    rate: 'Từ 11.000.000 VND',
    followers: '63K followers',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=1600&h=900&fit=crop',
    bio: 'Sora Vee hợp với các sân khấu trẻ, college tour, activation và club night cần một host sáng sân khấu, linh hoạt và giao tiếp tốt.',
    highlights: ['Youth stage fit', 'Flexible hosting', 'Festival ready'],
    performanceModes: ['Campus event', 'Festival warm-up', 'Club hosting'],
    cities: ['Biên Hòa', 'TP.HCM', 'Bình Dương'],
    socialProof: {
      monthlyReach: '430K reach / tháng',
      eventsDone: '72 phiên host / năm',
      brandTone: 'Fresh / social / energetic'
    }
  },
  {
    id: 10,
    slug: 'rex-nova',
    name: 'Rex Nova',
    category: 'rapper',
    gender: 'male',
    role: 'Rapper / Crowd Control',
    genres: 'Club Hip-hop / Battle / Showcase',
    location: 'Hải Phòng',
    availability: 'Available for tour support',
    rate: 'Từ 14.000.000 VND',
    followers: '58K followers',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1600&h=900&fit=crop',
    bio: 'Rex Nova theo hướng club hip-hop và showcase performance, phù hợp những line-up cần một rapper biết tương tác đám đông và giữ nhiệt tốt.',
    highlights: ['Club rap format', 'Crowd interaction', 'Tour support fit'],
    performanceModes: ['Showcase', 'Club night', 'Tour support'],
    cities: ['Hải Phòng', 'Hà Nội', 'Quảng Ninh'],
    socialProof: {
      monthlyReach: '390K reach / tháng',
      eventsDone: '44 show / năm',
      brandTone: 'Street / crowd / live-driven'
    }
  },
  {
    id: 11,
    slug: 'aria-rush',
    name: 'Aria Rush',
    category: 'dancer',
    gender: 'female',
    role: 'Dancer / Show Performer',
    genres: 'GoGo / Commercial / LED Choreography',
    location: 'TP.HCM',
    availability: 'Available for club showcase',
    rate: 'Tá»« 13.000.000 VND',
    followers: '69K followers',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1600&h=900&fit=crop',
    bio: 'Aria Rush theo hÆ°á»›ng performance dancer cho club showcase, opening act vÃ  cÃ¡c event cáº§n hÃ¬nh áº£nh sÃ¢n kháº¥u hiá»‡n Ä‘áº¡i, linh hoáº¡t vá»›i LED, visual vÃ  activation team.',
    highlights: ['Visual stage strong', 'LED choreography ready', 'Luxury club friendly'],
    performanceModes: ['Club showcase', 'Brand launch', 'VIP stage'],
    cities: ['TP.HCM', 'VÅ©ng TÃ u', 'PhÃº Quá»‘c'],
    socialProof: {
      monthlyReach: '510K reach / thÃ¡ng',
      eventsDone: '64 set / nÄƒm',
      brandTone: 'Glam / nightlife / visual-first'
    }
  },
  {
    id: 12,
    slug: 'kai-motion',
    name: 'Kai Motion',
    category: 'dancer',
    gender: 'male',
    role: 'Dancer / Hype Performer',
    genres: 'Hip-hop / Street Show / Crowd Interaction',
    location: 'HÃ  Ná»™i',
    availability: 'Weekend performance ready',
    rate: 'Tá»« 12.000.000 VND',
    followers: '57K followers',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=1100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?w=1600&h=900&fit=crop',
    bio: 'Kai Motion phÃ¹ há»£p cÃ¡c Ä‘Ãªm club, hip-hop showcase vÃ  activation cáº§n performer khuáº¥y Ä‘á»™ng Ä‘Ã¡m Ä‘Ã´ng, táº¡o nhá»‹p tÆ°Æ¡ng tÃ¡c trÆ°á»›c hoáº·c trong pháº§n headline.',
    highlights: ['Crowd interaction máº¡nh', 'Street energy', 'Warm-up set support'],
    performanceModes: ['Hip-hop showcase', 'Club warm-up', 'Street activation'],
    cities: ['HÃ  Ná»™i', 'Háº£i PhÃ²ng', 'Quáº£ng Ninh'],
    socialProof: {
      monthlyReach: '420K reach / thÃ¡ng',
      eventsDone: '58 set / nÄƒm',
      brandTone: 'Street / active / crowd-driven'
    }
  }
]

artistProfiles.push(photographerProfile)
artistProfiles.push(modelProfile)
artistProfiles.push(designerProfile)

export function getArtistBySlug(slug: string) {
  return repairVietnameseValue(artistProfiles).find((artist) => artist.slug === slug)
}

const artistRichOverrides: Partial<Record<string, Partial<ArtistRichContent>>> = {
  'neon-viper': {
    introduction: [
      'Neon Viper là gương mặt DJ chủ lực cho những đêm nhạc cần năng lượng lớn, hình ảnh hiện đại và khả năng giữ sàn bền trong nhiều khung giờ. Phong cách biểu diễn của anh thiên về future rave, big room và EDM festival, nhưng vẫn có độ linh hoạt để xử lý các set club đòi hỏi nhịp chuyển tinh tế hơn.',
      'Điểm mạnh của Neon Viper không chỉ nằm ở kỹ thuật set nhạc mà còn ở việc xây dựng trải nghiệm tổng thể: mood sân khấu, điểm rơi visual, nhịp crowd interaction và cách đẩy cao trào đúng thời điểm. Đây là kiểu nghệ sĩ phù hợp với venue muốn tạo cảm giác headline rõ ràng thay vì chỉ đơn thuần lấp line-up.',
      'Với các sự kiện thương hiệu, Neon Viper cũng phù hợp khi cần một nghệ sĩ có hình ảnh premium, dễ truyền thông, có thể phối hợp với MC, LED operator, vũ đoàn hoặc activation team để tạo nên một set hoàn chỉnh.'
    ],
    signatureMoments: [
      'Prime-time festival drop với visual đồng bộ LED và CO2',
      'Hybrid club set 90 phút giữ sàn ổn định từ opening peak đến closing',
      'Headline appearance phù hợp grand opening, countdown và brand nightlife campaign'
    ],
    videos: [
      {
        title: 'Festival energy live set',
        platform: 'YouTube',
        embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
        href: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
      },
      {
        title: 'Facebook nightlife showcase',
        platform: 'Facebook',
        embedUrl:
          'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebookapp%2Fvideos%2F10153231379946729%2F&show_text=false&width=1280',
        href: 'https://www.facebook.com/facebookapp/videos/10153231379946729/'
      }
    ],
    audio: [
      {
        title: 'Nonstop Festival Heat',
        subtitle: 'SoundCloud set preview phát trực tiếp trên profile',
        embedUrl:
          'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&color=%23ffb400&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true'
      },
      {
        title: 'Peak Hour Club Mix',
        subtitle: 'Bản mix dành cho venue cần chất club rõ hơn',
        embedUrl:
          'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/6844094&color=%23ffb400&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true'
      }
    ],
    gallery: [
      {
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=900&fit=crop',
        caption: 'Mainstage lighting moment'
      },
      {
        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&h=900&fit=crop',
        caption: 'VIP club performance atmosphere'
      },
      {
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=900&fit=crop',
        caption: 'Crowd reaction during headline set'
      },
      {
        image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=900&fit=crop',
        caption: 'Backstage and promo visual pack'
      }
    ],
    socials: [
      { label: 'Instagram', href: 'https://instagram.com/' },
      { label: 'Facebook', href: 'https://facebook.com/' },
      { label: 'YouTube', href: 'https://youtube.com/' },
      { label: 'SoundCloud', href: 'https://soundcloud.com/' }
    ],
    bookingNotes: [
      'Phù hợp headline slot từ 45 đến 90 phút',
      'Làm việc tốt với LED, visual operator và pyro/CO2 cue',
      'Có thể build set riêng theo concept thương hiệu hoặc venue opening'
    ],
    rider: [
      'DJ booth chuẩn club hoặc festival, 2-3 CDJ + mixer flagship',
      'Monitor riêng tại booth, mic talkback khi cần activation',
      'Line check trước giờ diễn tối thiểu 45 phút để đồng bộ visual cue'
    ],
    faq: [
      {
        question: 'Neon Viper hợp với loại sân khấu nào?',
        answer: 'Phù hợp nhất với club lớn, festival, countdown, launch event và các venue cần một gương mặt headline có sức đẩy crowd mạnh.'
      },
      {
        question: 'Có thể đặt set riêng theo concept không?',
        answer: 'Có. Profile này đã chuẩn bị theo hướng dễ nối CMS để sau này đội vận hành có thể thêm package riêng cho từng đêm nhạc hoặc từng thương hiệu.'
      }
    ]
  }
}

const repairedArtistRichOverrides = repairVietnameseValue(artistRichOverrides)

export function getArtistRichContent(artist: ArtistProfile): ArtistRichContent {
  const fallbackGallery = [
    {
      image: artist.cover,
      caption: `${artist.name} headline visual`
    },
    {
      image: artist.image,
      caption: `${artist.name} artist portrait`
    },
    {
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
      caption: 'Crowd atmosphere'
    },
    {
      image: 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?w=1200&h=900&fit=crop',
      caption: 'Stage environment'
    }
  ]

  const defaults: ArtistRichContent = {
    introduction: [
      `${artist.name} là ${artist.role.toLowerCase()} hoạt động mạnh tại ${artist.location}, theo đuổi định hướng ${artist.genres.toLowerCase()} và phù hợp với các sân khấu cần một cá tính biểu diễn rõ ràng.`,
      `Profile này được thiết kế như một landing booking chuyên nghiệp để giới thiệu chiều sâu hình ảnh, chất âm nhạc, độ phù hợp với venue và khả năng kết nối cộng đồng của nghệ sĩ.`,
      `Ngoài phần trình diễn chính, nghệ sĩ cũng có thể phối hợp với MC, media team, branding team hoặc production để tạo nên một trải nghiệm hoàn chỉnh hơn cho từng chương trình.`
    ],
    workExperience: [
      `Đã tham gia ${artist.socialProof.eventsDone} chương trình, đêm diễn và hoạt động thương hiệu phù hợp với định vị cá nhân.`,
      `Kinh nghiệm làm việc tại ${artist.cities.join(', ')} với các format ${artist.performanceModes.join(', ').toLowerCase()}.`,
      'Có thể phối hợp cùng đội booking, kỹ thuật và media theo timeline sản xuất đã thống nhất.'
    ],
    signatureMoments: artist.highlights,
    gallery: fallbackGallery,
    videos: [
      {
        title: `${artist.name} live showcase`,
        platform: 'YouTube',
        embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
        href: 'https://www.youtube.com/watch?v=ScMzIvxBSi4'
      }
    ],
    audio: [
      {
        title: `${artist.name} profile mix`,
        subtitle: 'Nhúng SoundCloud để khách xem profile có thể nghe ngay',
        embedUrl:
          'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&color=%23ffb400&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true'
      }
    ],
    socials: [
      { label: 'Instagram', href: 'https://instagram.com/' },
      { label: 'Facebook', href: 'https://facebook.com/' },
      { label: 'SoundCloud', href: 'https://soundcloud.com/' }
    ],
    bookingNotes: [
      `Phù hợp với ${artist.performanceModes.join(', ').toLowerCase()}`,
      `Có thể nhận booking tại ${artist.cities.join(', ')}`,
      `Định vị hình ảnh: ${artist.socialProof.brandTone}`
    ],
    rider: [
      'Cần timeline và line-up rõ để tối ưu flow biểu diễn',
      'Ưu tiên có soundcheck hoặc line check trước khi lên sân khấu',
      'Có thể phối hợp cùng đội media để quay highlight và recap'
    ],
    faq: [
      {
        question: 'Thời lượng set hoặc thời gian xuất hiện phổ biến là bao lâu?',
        answer: 'Thông thường từ 30 đến 90 phút tùy format chương trình, khung giờ và yêu cầu production của venue.'
      },
      {
        question: 'Profile này có thể mở rộng thêm gì sau khi nối CMS?',
        answer: 'Có thể thêm lịch diễn, gói booking, media kit, file rider tải về, nhiều audio/video hơn và các bài viết liên quan về nghệ sĩ.'
      }
    ]
  }

  return repairVietnameseValue({
    ...defaults,
    ...repairedArtistRichOverrides[artist.slug],
  })
}
