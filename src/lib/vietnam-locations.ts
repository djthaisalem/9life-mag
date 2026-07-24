export type VietnamRegionId = 'mien-bac' | 'mien-trung' | 'mien-nam'

export type VietnamLocation = {
  name: string
  region: VietnamRegionId
}

export const vietnamRegions: Array<{ id: VietnamRegionId; label: string }> = [
  { id: 'mien-bac', label: 'Miền Bắc' },
  { id: 'mien-trung', label: 'Miền Trung' },
  { id: 'mien-nam', label: 'Miền Nam' },
]

// Danh mục 34 tỉnh, thành phố trực thuộc Trung ương áp dụng từ 01/07/2025.
export const vietnamLocations: VietnamLocation[] = [
  { name: 'Hà Nội', region: 'mien-bac' },
  { name: 'Hải Phòng', region: 'mien-bac' },
  { name: 'Quảng Ninh', region: 'mien-bac' },
  { name: 'Cao Bằng', region: 'mien-bac' },
  { name: 'Lạng Sơn', region: 'mien-bac' },
  { name: 'Bắc Ninh', region: 'mien-bac' },
  { name: 'Hưng Yên', region: 'mien-bac' },
  { name: 'Ninh Bình', region: 'mien-bac' },
  { name: 'Phú Thọ', region: 'mien-bac' },
  { name: 'Thái Nguyên', region: 'mien-bac' },
  { name: 'Tuyên Quang', region: 'mien-bac' },
  { name: 'Lào Cai', region: 'mien-bac' },
  { name: 'Lai Châu', region: 'mien-bac' },
  { name: 'Điện Biên', region: 'mien-bac' },
  { name: 'Sơn La', region: 'mien-bac' },
  { name: 'Thanh Hóa', region: 'mien-trung' },
  { name: 'Nghệ An', region: 'mien-trung' },
  { name: 'Hà Tĩnh', region: 'mien-trung' },
  { name: 'Quảng Trị', region: 'mien-trung' },
  { name: 'Huế', region: 'mien-trung' },
  { name: 'Đà Nẵng', region: 'mien-trung' },
  { name: 'Quảng Ngãi', region: 'mien-trung' },
  { name: 'Gia Lai', region: 'mien-trung' },
  { name: 'Khánh Hòa', region: 'mien-trung' },
  { name: 'Đắk Lắk', region: 'mien-trung' },
  { name: 'Lâm Đồng', region: 'mien-trung' },
  { name: 'Hồ Chí Minh', region: 'mien-nam' },
  { name: 'Đồng Nai', region: 'mien-nam' },
  { name: 'Tây Ninh', region: 'mien-nam' },
  { name: 'Đồng Tháp', region: 'mien-nam' },
  { name: 'Vĩnh Long', region: 'mien-nam' },
  { name: 'Cần Thơ', region: 'mien-nam' },
  { name: 'An Giang', region: 'mien-nam' },
  { name: 'Cà Mau', region: 'mien-nam' },
]

export const vietnamLocationNames = vietnamLocations.map((location) => location.name)

export function getVietnamRegionLabel(locationName: string) {
  const location = vietnamLocations.find((item) => item.name === locationName)
  return vietnamRegions.find((region) => region.id === location?.region)?.label ?? ''
}

export function normalizeVietnamLocation(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  if (['tphcm', 'tp hcm', 'tp ho chi minh', 'ho chi minh'].includes(normalized)) return 'ho chi minh'
  return normalized
}

export function matchesVietnamLocation(value: string, locationName: string) {
  return normalizeVietnamLocation(value) === normalizeVietnamLocation(locationName)
}
