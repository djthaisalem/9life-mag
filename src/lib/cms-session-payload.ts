import 'server-only'

import { loadPayloadClient } from '@/lib/payload-runtime'

const CMS_ROLE_MAP: Record<string, string> = {
  admin: 'super_admin',
  super_admin: 'super_admin',
  security_admin: 'security_admin',
  finance: 'finance_ops',
  finance_ops: 'finance_ops',
  booking_ops: 'booking_ops',
  artist_ops: 'artist_ops',
  editor: 'editor',
}

export async function validatePayloadCmsCredentials(input: {
  email: string
  password: string
  otpCode?: string
}) {
  const payload = await loadPayloadClient()

  try {
    const result = await payload.login({
      collection: 'users',
      data: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    })
    const user = result.user as { isActive?: boolean; role?: string }
    const role = CMS_ROLE_MAP[user.role ?? '']

    if (!user.isActive || !role) {
      return { ok: false as const, reason: 'invalid_credentials' as const }
    }

    const requiredOtp = process.env.CMS_ADMIN_OTP_CODE?.trim()
    if (requiredOtp && input.otpCode?.trim() !== requiredOtp) {
      return { ok: false as const, reason: 'invalid_otp' as const }
    }

    return { ok: true as const, role }
  } catch {
    return { ok: false as const, reason: 'invalid_credentials' as const }
  }
}
