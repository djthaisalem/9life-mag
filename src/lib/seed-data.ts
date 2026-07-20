export const seedCategories = [
  { name: 'Sự kiện', slug: 'su-kien', description: 'Lịch diễn, festival, club show và activation.' },
  { name: 'Âm nhạc', slug: 'am-nhac', description: 'Xu hướng phát hành, chart và nghệ sĩ nổi bật.' },
  { name: 'Nightlife', slug: 'nightlife', description: 'Văn hóa đêm, venue và scene report.' }
]

export const seedArtists = [
  {
    stageName: 'Neon Viper',
    slug: 'neon-viper',
    role: 'dj',
    genres: [{ value: 'EDM' }, { value: 'Future Rave' }],
    serviceArea: 'TP.HCM',
    startingPrice: 25000000,
    isAvailable: true
  },
  {
    stageName: 'Echo Violet',
    slug: 'echo-violet',
    role: 'producer',
    genres: [{ value: 'Future Bass' }, { value: 'Pop EDM' }],
    serviceArea: 'Hà Nội',
    startingPrice: 18000000,
    isAvailable: true
  }
]

export const seedProducts = [
  {
    title: 'Summer EDM Pack 2026',
    slug: 'summer-edm-pack-2026',
    productType: 'package',
    price: 790000,
    currency: 'VND',
    licenseType: 'commercial'
  },
  {
    title: 'Night Drive Synthwave',
    slug: 'night-drive-synthwave',
    productType: 'track',
    price: 99000,
    currency: 'VND',
    licenseType: 'personal'
  }
]
