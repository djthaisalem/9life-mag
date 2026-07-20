export const starPackages = [
  { id: 'star-50', title: 'Star Boost 50', amount: 49000, stars: 50 },
  { id: 'star-120', title: 'Star Boost 120', amount: 99000, stars: 120 },
  { id: 'star-300', title: 'VIP Community 300', amount: 199000, stars: 300 },
] as const

export const paymentProviders = [
  { id: 'bank_qr', label: 'Bank QR', kind: 'vn' },
  { id: 'momo', label: 'MoMo', kind: 'vn' },
  { id: 'viettel_money', label: 'Viettel Money', kind: 'vn' },
  { id: 'paypal', label: 'PayPal', kind: 'global' },
] as const

export type PaymentProviderId = (typeof paymentProviders)[number]['id']

export type StarTopupRequest = {
  id: string
  transactionRef: string
  providerOrderId?: string
  userId: string
  userName: string
  userEmail: string
  packageId: string
  packageTitle: string
  provider: PaymentProviderId
  amount: number
  stars: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  note: string
  qrUrl?: string
  actionUrl?: string
  providerMessage: string
  userNotice: string
}
